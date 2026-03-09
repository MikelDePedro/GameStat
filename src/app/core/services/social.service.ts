import { Injectable, signal } from '@angular/core';

import { ReviewItem, SocialPost } from '../../models';

@Injectable({ providedIn: 'root' })
export class SocialService {
  readonly reviews = signal<ReviewItem[]>([
    {
      id: 'review-1',
      game: 'Valorant',
      rating: 5,
      comment: 'Buen ritmo competitivo y partidas muy agiles.',
      author: 'Iker Demo',
      createdAt: 'Hoy'
    },
    {
      id: 'review-2',
      game: 'EA FC 26',
      rating: 4,
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

  addReview(review: ReviewItem): void {
    this.reviews.update((items) => [review, ...items]);
  }

  addPost(post: SocialPost): void {
    this.posts.update((items) => [post, ...items]);
  }

  likePost(postId: string): void {
    this.posts.update((items) =>
      items.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post))
    );
  }
}
