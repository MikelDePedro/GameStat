import { Injectable, signal } from '@angular/core';

import { ReviewItem, SocialPost } from '../../models';
import { SupabaseService } from './supabase.service';

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
  readonly reviews = signal<ReviewItem[]>([
    {
      id: 'review-1',
      gameId: 323229,
      game: 'Valorant',
      title: 'Shooter muy fino',
      subtitle: 'Ideal para jugar competitivo con colegas',
      rating: 9,
      comment: 'Buen ritmo competitivo y partidas muy agiles.',
      author: 'Iker Demo',
      createdAt: 'Hoy'
    },
    {
      id: 'review-2',
      gameId: null,
      game: 'EA FC 26',
      title: 'Online bastante mejor',
      subtitle: 'Sigue dependiendo del meta, pero va en buena direccion',
      rating: 8,
      comment: 'Mejor online, aunque aun depende mucho del meta.',
      author: 'Claudia',
      createdAt: 'Ayer'
    }
  ]);

  readonly posts = signal<SocialPost[]>([
    {
      id: 'post-1',
      author: 'Marta',
      content: 'Quien se apunta a scrim esta noche? Necesitamos support.',
      likes: 18,
      createdAt: 'Hace 1 h'
    },
    {
      id: 'post-2',
      author: 'Iker Demo',
      content: 'He subido nueva review del parche. El balance esta mucho mejor.',
      likes: 7,
      createdAt: 'Hace 3 h'
    }
  ]);

  constructor(private readonly supabaseService: SupabaseService) {
    if (this.supabaseService.isConfigured) {
      void this.loadReviews().catch((error) => {
        console.error('No se pudieron cargar las reviews desde Supabase.', error);
      });
    }
  }

  async loadReviews(): Promise<void> {
    const client = this.supabaseService.client;
    if (!client) {
      return;
    }

    const { data, error } = await client
      .from('game_reviews')
      .select('id, user_id, rawg_id, game, title, subtitle, comment, rating, author, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(this.mapReviewError(error.message));
    }

    this.reviews.set((data as ReviewRow[] | null)?.map((row) => this.mapReviewRow(row)) ?? []);
  }

  async addReview(payload: CreateReviewPayload): Promise<void> {
    const normalized = this.normalizeReviewPayload(payload);
    const client = this.supabaseService.client;

    if (!client) {
      this.reviews.update((items) => [
        {
          id: crypto.randomUUID(),
          gameId: normalized.gameId,
          game: normalized.game,
          title: normalized.title,
          subtitle: normalized.subtitle,
          rating: normalized.rating,
          comment: normalized.comment,
          author: normalized.author,
          createdAt: 'Ahora'
        },
        ...items
      ]);
      return;
    }

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

    if (error) {
      throw new Error(this.mapReviewError(error.message));
    }

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

  addPost(post: SocialPost): void {
    this.posts.update((items) => [post, ...items]);
  }

  likePost(postId: string): void {
    this.posts.update((posts) =>
      posts.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );
  }

  private normalizeReviewPayload(payload: CreateReviewPayload): CreateReviewPayload {
    return {
      userId: payload.userId,
      gameId: payload.gameId,
      game: payload.game.trim(),
      title: payload.title.trim(),
      subtitle: payload.subtitle.trim(),
      comment: payload.comment.trim(),
      rating: payload.rating,
      author: payload.author.trim()
    };
  }

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
      createdAt: this.formatCreatedAt(row.created_at)
    };
  }

  private formatCreatedAt(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Ahora';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private mapReviewError(message: string): string {
    const normalized = message.toLowerCase();

    if (normalized.includes('game_reviews')) {
      return 'La tabla public.game_reviews no existe. Ejecuta supabase/game_reviews.sql.';
    }

    if (normalized.includes('row-level security')) {
      return 'La politica RLS de public.game_reviews no permite esta operacion.';
    }

    return message;
  }
}
