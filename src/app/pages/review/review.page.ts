import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonRange,
  IonText,
  IonTextarea
} from '@ionic/angular/standalone';

import { AuthService } from '../../core/services/auth.service';
import { SocialService } from '../../core/services/social.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonRange,
    IonText,
    IonTextarea
  ],
  styleUrls: ['./review.page.scss'],
  template: `
    <ion-content>
      <div class="page-shell page">
        <section class="surface-card form-card">
          <h1>Nueva review</h1>
          <ion-item>
            <ion-label position="stacked">Juego</ion-label>
            <ion-input [(ngModel)]="form.game"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Titulo</ion-label>
            <ion-input [(ngModel)]="form.title" placeholder="Tu titular para la review"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Subtitulo</ion-label>
            <ion-input [(ngModel)]="form.subtitle" placeholder="Resumen corto de tu opinion"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Comentario</ion-label>
            <ion-textarea [(ngModel)]="form.comment" autoGrow="true"></ion-textarea>
          </ion-item>
          <div class="range-wrap">
            <ion-text>Valoracion: {{ form.rating }}/10</ion-text>
            <ion-range min="1" max="10" step="1" snaps="true" [(ngModel)]="form.rating"></ion-range>
          </div>

          <ion-button expand="block" [disabled]="saving" (click)="addReview()">
            {{ saving ? 'Guardando...' : 'Guardar review' }}
          </ion-button>

          <ion-text color="danger" *ngIf="errorMessage">
            <p>{{ errorMessage }}</p>
          </ion-text>
        </section>

        <ion-list class="surface-card review-list">
          <ion-item lines="none" *ngFor="let review of social.reviews()">
            <ion-label>
              <h2>{{ review.game }} - {{ review.rating }}/10</h2>
              <h3>{{ review.title }}</h3>
              <p *ngIf="review.subtitle">{{ review.subtitle }}</p>
              <p>{{ review.comment }}</p>
              <p>{{ review.author }} - {{ review.createdAt }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  `
})
export class ReviewPage {
  form = {
    game: '',
    title: '',
    subtitle: '',
    comment: '',
    rating: 7
  };
  saving = false;
  errorMessage = '';

  constructor(
    public readonly social: SocialService,
    private readonly auth: AuthService
  ) {}

  async addReview(): Promise<void> {
    const user = this.auth.currentUser();
    if (
      !user ||
      !this.form.game.trim() ||
      !this.form.title.trim() ||
      !this.form.comment.trim()
    ) {
      return;
    }

    this.errorMessage = '';
    this.saving = true;

    try {
      await this.social.addReview({
        userId: user.id,
        gameId: null,
        game: this.form.game,
        title: this.form.title,
        subtitle: this.form.subtitle,
        comment: this.form.comment,
        rating: this.form.rating,
        author: user.name
      });

      this.form = {
        game: '',
        title: '',
        subtitle: '',
        comment: '',
        rating: 7
      };
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'No se pudo guardar la review.';
    } finally {
      this.saving = false;
    }
  }
}
