import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  IonContent,
  IonSpinner,
  IonText
} from '@ionic/angular/standalone';

import { UserProfile } from '../../models';
import { SupabaseService } from '../../core/services/supabase.service';

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  favorite_game: string;
  bio: string;
  avatar: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonSpinner,
    IonText
  ],
  styleUrls: ['./users.page.scss'],
  template: `
    <ion-content>
      <div class="page-shell page">
        <section class="surface-card users-header">
          <p class="eyebrow">Comunidad</p>
          <h1>Users</h1>
          <p>Usuarios registrados en la aplicacion.</p>
        </section>

        <section class="surface-card users-list">
          <div class="loading" *ngIf="loading">
            <ion-spinner name="crescent"></ion-spinner>
          </div>

          <ion-text color="danger" *ngIf="error">
            <p>{{ error }}</p>
          </ion-text>

          <article class="user-row" *ngFor="let user of users; trackBy: trackByUserId">
            <div class="avatar">{{ user.avatar }}</div>
            <div class="user-main">
              <h2>{{ user.name }}</h2>
              <p>{{ user.email }}</p>
              <span>{{ user.favoriteGame || 'Sin juego favorito' }}</span>
            </div>
          </article>
        </section>
      </div>
    </ion-content>
  `
})
export class UsersPage implements OnInit {
  users: UserProfile[] = [];
  loading = false;
  error = '';

  constructor(private readonly supabaseService: SupabaseService) {}

  ngOnInit(): void {
    void this.loadUsers();
  }

  trackByUserId(_: number, user: UserProfile): string {
    return user.id;
  }

  private async loadUsers(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const client = this.supabaseService.assertConfigured();
      const { data, error } = await client
        .from('profiles')
        .select('id, email, name, favorite_game, bio, avatar')
        .order('name', { ascending: true });

      if (error) {
        throw new Error(this.mapProfileError(error.message));
      }

      this.users = ((data as ProfileRow[] | null) ?? []).map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        favoriteGame: row.favorite_game,
        bio: row.bio,
        avatar: row.avatar || this.initials(row.name)
      }));
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudieron cargar los usuarios.';
    } finally {
      this.loading = false;
    }
  }

  private initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase() ?? '')
      .join('');
  }

  private mapProfileError(message: string): string {
    const normalized = message.toLowerCase();

    if (normalized.includes('relation') && normalized.includes('profiles')) {
      return 'La tabla public.profiles no existe en Supabase.';
    }

    if (normalized.includes('row-level security')) {
      return 'La politica RLS de public.profiles no permite listar usuarios.';
    }

    return message;
  }
}
