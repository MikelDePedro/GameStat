import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonRange,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import { AuthService } from '../core/services/auth.service';
import { SocialService } from '../core/services/social.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonRange,
    IonText,
    IonTitle,
    IonToolbar
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Review</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page-shell page">
        <section class="surface-card form-card">
          <h1>Nueva review</h1>
          <ion-item>
            <ion-label position="stacked">Juego</ion-label>
            <ion-input [(ngModel)]="form.game"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Comentario</ion-label>
            <ion-input [(ngModel)]="form.comment"></ion-input>
          </ion-item>
          <div class="range-wrap">
            <ion-text>Valoracion: {{ form.rating }}/5</ion-text>
            <ion-range min="1" max="5" step="1" snaps="true" [(ngModel)]="form.rating"></ion-range>
          </div>

          <ion-button expand="block" (click)="addReview()">Publicar review</ion-button>
        </section>

        <ion-list class="surface-card review-list">
          <ion-item lines="none" *ngFor="let review of social.reviews()">
            <ion-label>
              <h2>{{ review.game }} - {{ review.rating }}/5</h2>
              <p>{{ review.comment }}</p>
              <p>{{ review.author }} - {{ review.createdAt }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  `,
  styles: [`
    .page {
      padding: 20px 20px 88px;
    }
    .form-card,
    .review-list {
      padding: 20px;
    }
    .review-list {
      margin-top: 20px;
    }
    .range-wrap {
      padding: 12px 8px;
    }
  `]
})
export class ReviewPage {
  form = {
    game: '',
    comment: '',
    rating: 4
  };

  constructor(
    public readonly social: SocialService,
    private readonly auth: AuthService
  ) {}

  addReview(): void {
    const user = this.auth.currentUser();
    if (!user || !this.form.game.trim() || !this.form.comment.trim()) {
      return;
    }

    this.social.addReview({
      id: crypto.randomUUID(),
      game: this.form.game.trim(),
      comment: this.form.comment.trim(),
      rating: this.form.rating,
      author: user.name,
      createdAt: 'Ahora'
    });

    this.form = {
      game: '',
      comment: '',
      rating: 4
    };
  }
}
