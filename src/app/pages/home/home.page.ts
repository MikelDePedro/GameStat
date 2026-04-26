import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonButton, IonContent, IonSpinner, IonText } from '@ionic/angular/standalone';
import { finalize } from 'rxjs';

import { RawgGame } from '../../core/models/rawg.models';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { GamesService } from '../../core/services/games.service';
import { SocialService } from '../../core/services/social.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonContent,
    IonSpinner,
    IonText,
    RouterLink,
    RouterLinkActive
  ],
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

        <section class="surface-card games-preview">
          <div class="preview-header">
            <div>
              <p class="eyebrow">Catalogo RAWG</p>
              <h2>Juegos populares</h2>
            </div>
            <ion-button fill="outline" [routerLink]="['/tabs/games']">Ver catalogo</ion-button>
          </div>

          <div class="games-loading" *ngIf="gamesLoading">
            <ion-spinner name="crescent"></ion-spinner>
          </div>

          <ion-text color="danger" *ngIf="gamesError">
            <p>{{ gamesError }}</p>
          </ion-text>

          <div class="games-grid" *ngIf="!gamesLoading && !gamesError && popularGames.length">
            <article class="game-tile" *ngFor="let game of popularGames; trackBy: trackByGameId">
              <img [src]="game.background_image || fallbackCover" [alt]="game.name" loading="lazy" />
              <div>
                <h3>{{ game.name }}</h3>
                <p>Rating: {{ game.rating | number: '1.1-1' }}</p>
                <p>Lanzamiento: {{ game.released || 'Sin fecha' }}</p>
              </div>
            </article>
          </div>
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
export class HomePage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly fallbackCover = 'https://via.placeholder.com/360x220?text=Juego';
  readonly userName = computed(() => this.auth.currentUser()?.name ?? 'Jugador');
  readonly stats = computed(() => ({
    reviews: this.social.reviews().length,
    posts: this.social.posts().length,
    rooms: this.chat.rooms().length
  }));

  popularGames: RawgGame[] = [];
  gamesLoading = false;
  gamesError = '';

  constructor(
    private readonly auth: AuthService,
    private readonly social: SocialService,
    private readonly chat: ChatService,
    private readonly gamesService: GamesService
  ) {}

  ngOnInit(): void {
    this.loadPopularGames();
  }

  trackByGameId(_: number, game: RawgGame): number {
    return game.id;
  }

  private loadPopularGames(): void {
    this.gamesLoading = true;
    this.gamesError = '';

    this.gamesService
      .getPopularGames(1, 6)
      .pipe(
        finalize(() => {
          this.gamesLoading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (page) => {
          this.popularGames = page.items;
        },
        error: (error: Error) => {
          this.gamesError = error.message;
        }
      });
  }
}
