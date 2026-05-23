import { Injectable, signal } from '@angular/core';

import { FollowStats } from '../../models';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class FollowService {
  /** Cache local: a quién sigo (mis followed_id). */
  readonly followingIds = signal<Set<string>>(new Set());
  private bootstrapped = false;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auth: AuthService
  ) {
    if (this.supabaseService.isConfigured) {
      void this.bootstrap();
    }
  }

  private async bootstrap(): Promise<void> {
    if (this.bootstrapped) return;
    this.bootstrapped = true;
    await this.auth.waitUntilReady();
    if (!this.auth.currentUser()) return;
    await this.refreshFollowing().catch((e) => console.error('follows:', e));
  }

  async refreshFollowing(): Promise<void> {
    const me = this.auth.currentUser();
    const client = this.supabaseService.client;
    if (!me || !client) return;

    const { data, error } = await client
      .from('follows')
      .select('followed_id')
      .eq('follower_id', me.id);

    if (error) throw new Error(this.mapError(error.message));

    this.followingIds.set(
      new Set(((data as { followed_id: string }[] | null) ?? []).map((r) => r.followed_id))
    );
  }

  isFollowing(userId: string): boolean {
    return this.followingIds().has(userId);
  }

  async follow(userId: string): Promise<void> {
    const me = this.auth.currentUser();
    if (!me) throw new Error('No hay sesion activa.');
    if (userId === me.id) return;

    const client = this.supabaseService.assertConfigured();
    const { error } = await client
      .from('follows')
      .upsert(
        { follower_id: me.id, followed_id: userId },
        { onConflict: 'follower_id,followed_id' }
      );

    if (error) throw new Error(this.mapError(error.message));

    this.followingIds.update((set) => {
      const next = new Set(set);
      next.add(userId);
      return next;
    });
  }

  async unfollow(userId: string): Promise<void> {
    const me = this.auth.currentUser();
    if (!me) throw new Error('No hay sesion activa.');

    const client = this.supabaseService.assertConfigured();
    const { error } = await client
      .from('follows')
      .delete()
      .eq('follower_id', me.id)
      .eq('followed_id', userId);

    if (error) throw new Error(this.mapError(error.message));

    this.followingIds.update((set) => {
      const next = new Set(set);
      next.delete(userId);
      return next;
    });
  }

  async getStats(userId: string): Promise<FollowStats> {
    const client = this.supabaseService.assertConfigured();
    const me = this.auth.currentUser();

    const [followersRes, followingRes, meRes] = await Promise.all([
      client.from('follows').select('follower_id', { count: 'exact', head: true }).eq('followed_id', userId),
      client.from('follows').select('followed_id', { count: 'exact', head: true }).eq('follower_id', userId),
      me
        ? client
            .from('follows')
            .select('followed_id', { count: 'exact', head: true })
            .eq('follower_id', me.id)
            .eq('followed_id', userId)
        : Promise.resolve({ count: 0, error: null } as { count: number | null; error: null })
    ]);

    if (followersRes.error) throw new Error(this.mapError(followersRes.error.message));
    if (followingRes.error) throw new Error(this.mapError(followingRes.error.message));

    return {
      followers: followersRes.count ?? 0,
      following: followingRes.count ?? 0,
      isFollowing: (meRes.count ?? 0) > 0
    };
  }

  private mapError(message: string): string {
    const m = message.toLowerCase();
    if (m.includes('follows')) {
      return 'La tabla public.follows no existe. Ejecuta supabase/follows.sql.';
    }
    if (m.includes('row-level security')) {
      return 'La politica RLS de public.follows no permite esta operacion.';
    }
    return message;
  }
}
