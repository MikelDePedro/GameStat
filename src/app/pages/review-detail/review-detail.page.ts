import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonSpinner,
  IonText
} from '@ionic/angular/standalone';

import { ReviewItem, ReviewStats } from '../../models';
import { SocialService } from '../../core/services/social.service';
import { ReviewStatsCardComponent } from '../../shared';
import { RatingStarsComponent } from '../../shared';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, ReviewStatsCardComponent, RatingStarsComponent, IonButton, IonContent, IonSpinner, IonText],
  styleUrls: ['./review-detail.page.scss'],
  template: `
    <ion-content>
      <div class="page-shell page">
        <ion-button fill="clear" routerLink="/tabs/review">Volver a reviews</ion-button>

        <section class="surface-card detail-card" *ngIf="review() as r">
          <p class="eyebrow">Review</p>
          <header>
            <div>
              <h1>{{ r.title }}</h1>
              <p class="subtitle" *ngIf="r.subtitle">{{ r.subtitle }}</p>
            </div>
            <app-rating-stars [value]="r.rating" [readonly]="true" [showValue]="true"></app-rating-stars>
          </header>

          <div class="game-line">
            <strong>{{ r.game }}</strong>
            <small>{{ r.author }} - {{ r.createdAt }}</small>
          </div>

          <p class="comment">{{ r.comment }}</p>
        </section>

        <section class="surface-card" *ngIf="reviewStatsLoading() || reviewStats()">
          <app-review-stats-card
            [stats]="reviewStats()"
            [title]="'Estadisticas del juego'"
            [emptyText]="reviewStatsError() || 'No hay estadisticas disponibles para esta review.'">
          </app-review-stats-card>
        </section>

        <div class="loading" *ngIf="loading()">
          <ion-spinner name="crescent"></ion-spinner>
        </div>

        <ion-text color="danger" *ngIf="error()">
          <p>{{ error() }}</p>
        </ion-text>
      </div>
    </ion-content>
  `
})
export class ReviewDetailPage implements OnInit {
  readonly review = signal<ReviewItem | null>(null);
  readonly reviewStats = signal<ReviewStats | null>(null);
  readonly loading = signal(false);
  readonly reviewStatsLoading = signal(false);
  readonly reviewStatsError = signal('');
  readonly error = signal('');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly social: SocialService
  ) {}

  async ngOnInit(): Promise<void> {
    const reviewId = this.route.snapshot.paramMap.get('reviewId');
    if (!reviewId) {
      this.error.set('Review no encontrada.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    try {
      const review = await this.social.getReviewById(reviewId);
      this.review.set(review);
      if (review.gameId !== null) {
        await this.loadReviewStats(review.gameId);
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo cargar la review.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadReviewStats(gameId: number): Promise<void> {
    this.reviewStatsLoading.set(true);
    this.reviewStatsError.set('');
    try {
      this.reviewStats.set(await this.social.getReviewStats(gameId));
    } catch (error) {
      this.reviewStats.set(null);
      this.reviewStatsError.set(
        error instanceof Error ? error.message : 'No se pudieron cargar las estadisticas.'
      );
    } finally {
      this.reviewStatsLoading.set(false);
    }
  }
}
