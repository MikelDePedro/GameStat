import { CommonModule } from '@angular/common';
import { Component, Input, computed } from '@angular/core';

import { ReviewStats } from '../../../models';

@Component({
  selector: 'app-review-stats-card',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { display: block; }
    .review-stats-card {
      border-radius: 24px;
      padding: 1.25rem;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.78));
      border: 1px solid rgba(148, 163, 184, 0.16);
      box-shadow: 0 18px 48px rgba(2, 6, 23, 0.28);
    }
    .review-stats-card h3 {
      margin: 0 0 0.25rem;
      font-size: 1.05rem;
      letter-spacing: 0.01em;
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 0.9rem 1.2rem;
      align-items: baseline;
      margin-bottom: 1rem;
      color: rgba(226, 232, 240, 0.92);
    }
    .summary strong {
      font-size: 2rem;
      line-height: 1;
      color: #fbbf24;
    }
    .summary small {
      color: rgba(203, 213, 225, 0.82);
    }
    .bars {
      display: grid;
      gap: 0.55rem;
    }
    .bar-row {
      display: grid;
      grid-template-columns: 2.2rem 1fr 3rem;
      gap: 0.75rem;
      align-items: center;
      color: rgba(226, 232, 240, 0.9);
      font-size: 0.92rem;
    }
    .track {
      height: 0.7rem;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.16);
    }
    .fill {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #fbbf24, #fb7185);
      transition: width 180ms ease;
    }
    .empty {
      margin: 0.75rem 0 0;
      color: rgba(203, 213, 225, 0.78);
    }
  `],
  template: `
    <section class="review-stats-card">
      <h3>{{ title }}</h3>

      <ng-container *ngIf="stats?.totalCount; else emptyState">
        <div class="summary">
          <strong>{{ stats?.avgRating | number: '1.1-1' }}/10</strong>
          <small>{{ stats?.totalCount }} reviews publicadas</small>
        </div>

        <div class="bars">
          <div class="bar-row" *ngFor="let rating of ratings()">
            <span>{{ rating }}</span>
            <div class="track" [attr.aria-label]="'Rating ' + rating">
              <div
                class="fill"
                [style.width.%]="percentageFor(rating)">
              </div>
            </div>
            <strong>{{ countFor(rating) }}</strong>
          </div>
        </div>
      </ng-container>

      <ng-template #emptyState>
        <p class="empty">{{ emptyText }}</p>
      </ng-template>
    </section>
  `
})
export class ReviewStatsCardComponent {
  @Input() stats: ReviewStats | null = null;
  @Input() title = 'Distribucion de valoraciones';
  @Input() emptyText = 'Aun no hay reviews para mostrar.';

  readonly ratings = computed(() => Array.from({ length: 10 }, (_, index) => index + 1));

  countFor(rating: number): number {
    return this.stats?.distribution?.[rating - 1] ?? 0;
  }

  percentageFor(rating: number): number {
    const stats = this.stats;
    if (!stats?.totalCount) return 0;
    return Math.max(0, Math.min(100, (this.countFor(rating) / stats.totalCount) * 100));
  }
}