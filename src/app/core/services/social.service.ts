import { Injectable, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';

import { ReviewItem, SocialComment, SocialPost } from '../../models';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

// ---------- Filas Supabase ----------
interface ReviewRow {
  id: string;
  user_id: string;
  rawg_id: number | null;
  game: string;
  title: string;
  subtitle: string;
  comment: string;
  rating: number;
  author: string;
  created_at: string;
}

interface SocialFeedRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
  likes_count: number;
  comments_count: number;
}

interface SocialPostRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface SocialCommentRow {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface ProfileSummaryRow {
  id: string;
  name: string | null;
  avatar: string | null;
}

export interface CreateReviewPayload {
  userId: string;
  gameId: number | null;
  game: string;
  title: string;
  subtitle: string;
  comment: string;
  rating: number;
  author: string;
}

@Injectable({ providedIn: 'root' })
export class SocialService {
  readonly reviews = signal<ReviewItem[]>([]);
  readonly posts = signal<SocialPost[]>([]);
  readonly loadingPosts = signal(false);

  private postsChannel: RealtimeChannel | null = null;
  private likesChannel: RealtimeChannel | null = null;
  private initialized = false;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auth: AuthService
  ) {
    if (this.supabaseService.isConfigured) {
      void this.bootstrap();
    }
  }

  // -------------------------------------------------------------------
  // BOOTSTRAP / REALTIME
  // -------------------------------------------------------------------
  private async bootstrap(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    await this.auth.waitUntilReady();
    await Promise.all([
      this.loadReviews().catch((e) => console.error('reviews:', e)),
      this.loadPosts().catch((e) => console.error('posts:', e))
    ]);
    this.subscribeRealtime();
  }

  private subscribeRealtime(): void {
    const client = this.supabaseService.client;
    if (!client) return;

    this.postsChannel?.unsubscribe();
    this.likesChannel?.unsubscribe();

    this.postsChannel = client
      .channel('social_posts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'social_posts' },
        () => {
          void this.loadPosts();
        }
      )
      .subscribe();

    this.likesChannel = client
      .channel('social_post_likes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'social_post_likes' },
        () => {
          void this.loadPosts();
        }
      )
      .subscribe();
  }

  // -------------------------------------------------------------------
  // REVIEWS
  // -------------------------------------------------------------------
  async loadReviews(): Promise<void> {
    const client = this.supabaseService.client;
    if (!client) return;

    const { data, error } = await client
      .from('game_reviews')
      .select('id, user_id, rawg_id, game, title, subtitle, comment, rating, author, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(this.mapError(error.message, 'game_reviews'));

    this.reviews.set((data as ReviewRow[] | null)?.map((row) => this.mapReviewRow(row)) ?? []);
  }

  async addReview(payload: CreateReviewPayload): Promise<void> {
    const client = this.supabaseService.assertConfigured();
    const normalized = this.normalizeReviewPayload(payload);

    const { data, error } = await client
      .from('game_reviews')
      .insert({
        user_id: normalized.userId,
        rawg_id: normalized.gameId,
        game: normalized.game,
        title: normalized.title,
        subtitle: normalized.subtitle,
        comment: normalized.comment,
        rating: normalized.rating,
        author: normalized.author
      })
      .select('id, user_id, rawg_id, game, title, subtitle, comment, rating, author, created_at')
      .single<ReviewRow>();

    if (error) throw new Error(this.mapError(error.message, 'game_reviews'));

    this.reviews.update((items) => [this.mapReviewRow(data), ...items]);
  }

  getReviewsForGame(gameId: number, gameName?: string): ReviewItem[] {
    const normalizedName = gameName?.trim().toLowerCase();
    return this.reviews().filter(
      (review) =>
        review.gameId === gameId ||
        (normalizedName ? review.game.trim().toLowerCase() === normalizedName : false)
    );
  }

  async getReviewsForUser(userId: string): Promise<ReviewItem[]> {
    const client = this.supabaseService.assertConfigured();
    const { data, error } = await client
      .from('game_reviews')
      .select('id, user_id, rawg_id, game, title, subtitle, comment, rating, author, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(this.mapError(error.message, 'game_reviews'));
    return ((data as ReviewRow[] | null) ?? []).map((row) => this.mapReviewRow(row));
  }

  // -------------------------------------------------------------------
  // POSTS
  // -------------------------------------------------------------------
  async loadPosts(): Promise<void> {
    const client = this.supabaseService.client;
    if (!client) return;
    const me = this.auth.currentUser()?.id ?? null;

    this.loadingPosts.set(true);
    try {
      const { data, error } = await client
        .from('social_feed')
        .select('id, user_id, content, created_at, author_name, author_avatar, likes_count, comments_count')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw new Error(this.mapError(error.message, 'social_posts'));

      let likedIds = new Set<string>();
      if (me) {
        const { data: likes } = await client
          .from('social_post_likes')
          .select('post_id')
          .eq('user_id', me);
        likedIds = new Set(((likes as { post_id: string }[] | null) ?? []).map((l) => l.post_id));
      }

      this.posts.set(
        ((data as SocialFeedRow[] | null) ?? []).map((row) =>
          this.mapFeedRow(row, likedIds.has(row.id))
        )
      );
    } finally {
      this.loadingPosts.set(false);
    }
  }

  async getPostsByUser(userId: string): Promise<SocialPost[]> {
    const client = this.supabaseService.assertConfigured();
    const { data, error } = await client
      .from('social_feed')
      .select('id, user_id, content, created_at, author_name, author_avatar, likes_count, comments_count')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(this.mapError(error.message, 'social_posts'));
    return ((data as SocialFeedRow[] | null) ?? []).map((row) => this.mapFeedRow(row, false));
  }

  async createPost(content: string): Promise<void> {
    const me = this.auth.currentUser();
    if (!me) throw new Error('Necesitas sesion para publicar.');
    const clean = content.trim();
    if (!clean) return;

    const client = this.supabaseService.assertConfigured();
    const { data, error } = await client
      .from('social_posts')
      .insert({ user_id: me.id, content: clean })
      .select('id, user_id, content, created_at')
      .single<SocialPostRow>();

    if (error) throw new Error(this.mapError(error.message, 'social_posts'));

    const optimistic: SocialPost = {
      id: data.id,
      userId: data.user_id,
      author: me.name,
      authorAvatar: me.avatar || this.initials(me.name),
      content: data.content,
      likes: 0,
      comments: 0,
      liked: false,
      createdAt: this.formatDate(data.created_at),
      createdAtTimestamp: new Date(data.created_at).getTime()
    };
    this.posts.update((items) => [optimistic, ...items.filter((p) => p.id !== optimistic.id)]);
  }

  async deletePost(postId: string): Promise<void> {
    const client = this.supabaseService.assertConfigured();
    const { error } = await client.from('social_posts').delete().eq('id', postId);
    if (error) throw new Error(this.mapError(error.message, 'social_posts'));
    this.posts.update((items) => items.filter((p) => p.id !== postId));
  }

  async toggleLike(postId: string): Promise<void> {
    const me = this.auth.currentUser();
    if (!me) return;
    const client = this.supabaseService.assertConfigured();

    const current = this.posts().find((p) => p.id === postId);
    const liked = current?.liked ?? false;

    // Optimista
    this.posts.update((items) =>
      items.map((p) =>
        p.id === postId
          ? { ...p, liked: !liked, likes: Math.max(0, p.likes + (liked ? -1 : 1)) }
          : p
      )
    );

    const result = liked
      ? await client.from('social_post_likes').delete().eq('post_id', postId).eq('user_id', me.id)
      : await client
          .from('social_post_likes')
          .upsert({ post_id: postId, user_id: me.id }, { onConflict: 'post_id,user_id' });

    if (result.error) {
      // Rollback
      this.posts.update((items) =>
        items.map((p) =>
          p.id === postId
            ? { ...p, liked, likes: Math.max(0, p.likes + (liked ? 1 : -1)) }
            : p
        )
      );
      throw new Error(this.mapError(result.error.message, 'social_post_likes'));
    }
  }

  hasLikedPost(postId: string): boolean {
    return this.posts().find((p) => p.id === postId)?.liked ?? false;
  }

  // -------------------------------------------------------------------
  // COMENTARIOS
  // -------------------------------------------------------------------
  async getComments(postId: string): Promise<SocialComment[]> {
    const client = this.supabaseService.assertConfigured();
    const { data, error } = await client
      .from('social_post_comments')
      .select('id, post_id, user_id, content, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(this.mapError(error.message, 'social_post_comments'));

    const comments = (data as SocialCommentRow[] | null) ?? [];
    const profilesById = await this.loadProfilesById(comments.map((row) => row.user_id));

    return comments.map((row) => {
      const prof = profilesById.get(row.user_id);
      const author = prof?.name ?? 'Usuario';

      return {
        id: row.id,
        postId: row.post_id,
        userId: row.user_id,
        author,
        authorAvatar: prof?.avatar || this.initials(author),
        content: row.content,
        createdAt: this.formatDate(row.created_at)
      };
    });
  }

  async addComment(postId: string, content: string): Promise<SocialComment> {
    const me = this.auth.currentUser();
    if (!me) throw new Error('Necesitas sesion para comentar.');
    const clean = content.trim();
    if (!clean) throw new Error('Escribe un comentario.');

    const client = this.supabaseService.assertConfigured();
    const { data, error } = await client
      .from('social_post_comments')
      .insert({ post_id: postId, user_id: me.id, content: clean })
      .select('id, post_id, user_id, content, created_at')
      .single<SocialCommentRow>();

    if (error) throw new Error(this.mapError(error.message, 'social_post_comments'));

    this.posts.update((items) =>
      items.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
    );

    return {
      id: data.id,
      postId: data.post_id,
      userId: data.user_id,
      author: me.name,
      authorAvatar: me.avatar || this.initials(me.name),
      content: data.content,
      createdAt: this.formatDate(data.created_at)
    };
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private mapReviewRow(row: ReviewRow): ReviewItem {
    return {
      id: row.id,
      gameId: row.rawg_id,
      game: row.game,
      title: row.title,
      subtitle: row.subtitle,
      rating: row.rating,
      comment: row.comment,
      author: row.author,
      createdAt: this.formatDate(row.created_at)
    };
  }

  private mapFeedRow(row: SocialFeedRow, liked: boolean): SocialPost {
    const ts = new Date(row.created_at).getTime();
    const author = row.author_name ?? 'Usuario';
    return {
      id: row.id,
      userId: row.user_id,
      author,
      authorAvatar: row.author_avatar || this.initials(author),
      content: row.content,
      likes: row.likes_count ?? 0,
      comments: row.comments_count ?? 0,
      liked,
      createdAt: this.formatDate(row.created_at),
      createdAtTimestamp: Number.isFinite(ts) ? ts : Date.now()
    };
  }

  private normalizeReviewPayload(p: CreateReviewPayload): CreateReviewPayload {
    return {
      userId: p.userId,
      gameId: p.gameId,
      game: p.game.trim(),
      title: p.title.trim(),
      subtitle: p.subtitle.trim(),
      comment: p.comment.trim(),
      rating: p.rating,
      author: p.author.trim()
    };
  }

  private async loadProfilesById(userIds: string[]): Promise<Map<string, ProfileSummaryRow>> {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    const profilesById = new Map<string, ProfileSummaryRow>();

    if (!uniqueIds.length) {
      return profilesById;
    }

    const client = this.supabaseService.assertConfigured();
    const { data, error } = await client
      .from('profiles')
      .select('id, name, avatar')
      .in('id', uniqueIds);

    if (error) {
      throw new Error(this.mapError(error.message, 'profiles'));
    }

    for (const profile of (data as ProfileSummaryRow[] | null) ?? []) {
      profilesById.set(profile.id, profile);
    }

    return profilesById;
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Ahora';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private initials(name: string): string {
    return (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((it) => it[0]?.toUpperCase() ?? '')
      .join('');
  }

  private mapError(message: string, table: string): string {
    const normalized = message.toLowerCase();
    if (normalized.includes(table)) {
      return `La tabla public.${table} no existe o no es accesible. Ejecuta los scripts en supabase/.`;
    }
    if (normalized.includes('row-level security')) {
      return `La politica RLS de public.${table} no permite esta operacion.`;
    }
    return message;
  }
}
