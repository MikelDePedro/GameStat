import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import { AuthService } from '../core/services/auth.service';
import { ChatService } from '../core/services/chat.service';
import { SocialService } from '../core/services/social.service';

@Component({
  standalone: true,
  imports: [RouterLink, IonButton, IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Home</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page-shell page">
        <section class="welcome surface-card">
          <p class="eyebrow">Bienvenido</p>
          <h1>{{ userName() }}</h1>
          <p>Tu panel principal concentra actividad, reviews y conversaciones activas.</p>
        </section>

        <section class="card-grid">
          <article class="surface-card stat">
            <span>{{ stats().reviews }}</span>
            <p>Reviews publicadas</p>
          </article>
          <article class="surface-card stat">
            <span>{{ stats().posts }}</span>
            <p>Posts en la comunidad</p>
          </article>
          <article class="surface-card stat">
            <span>{{ stats().rooms }}</span>
            <p>Chats activos</p>
          </article>
        </section>

        <section class="card-grid quick-links">
          <article class="surface-card quick-card">
            <h2>Nueva review</h2>
            <p>Comparte tu opinion sobre un juego o actualizacion.</p>
            <ion-button routerLink="/tabs/review" fill="outline">Ir a Review</ion-button>
          </article>
          <article class="surface-card quick-card">
            <h2>Comunidad</h2>
            <p>Publica contenido o entra a tus chats personales y grupales.</p>
            <ion-button routerLink="/tabs/social" fill="outline">Ir a Social</ion-button>
          </article>
        </section>
      </div>
    </ion-content>
  `,
  styles: [`
    .page {
      padding: 20px 20px 88px;
    }
    .welcome,
    .stat,
    .quick-card {
      padding: 20px;
    }
    .welcome {
      margin-bottom: 20px;
    }
    .eyebrow {
      color: #60a5fa;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 12px;
    }
    .stat span {
      display: block;
      font-size: 2rem;
      font-weight: 700;
    }
    .quick-links {
      margin-top: 20px;
    }
  `]
})
export class HomePage {
  readonly userName = computed(() => this.auth.currentUser()?.name ?? 'Jugador');
  readonly stats = computed(() => ({
    reviews: this.social.reviews().length,
    posts: this.social.posts().length,
    rooms: this.chat.rooms().length
  }));

  constructor(
    private readonly auth: AuthService,
    private readonly social: SocialService,
    private readonly chat: ChatService
  ) {}
}
