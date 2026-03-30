import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { SocialService } from '../../core/services/social.service';

@Component({
  standalone: true,
  imports: [IonButton, IonContent, RouterLink, RouterLinkActive],
  styleUrls: ['./home.page.scss'],
  template: `
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
            <ion-button class="action-button" color="primary" expand="block" [routerLink]="['/tabs/review']" routerLinkActive="action-button-active">
              Ir a Review
            </ion-button>
          </article>
          <article class="surface-card quick-card">
            <h2>Comunidad</h2>
            <p>Publica contenido o entra a tus chats personales y grupales.</p>
            <ion-button class="action-button" color="primary" expand="block" [routerLink]="['/tabs/social']" routerLinkActive="action-button-active">
              Ir a Social
            </ion-button>
          </article>
        </section>
      </div>
    </ion-content>
  `
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

