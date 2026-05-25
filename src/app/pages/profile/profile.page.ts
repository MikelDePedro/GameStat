import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonAvatar,
  IonButton,
  IonBadge,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTextarea,
  IonToast,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubbleEllipsesOutline,
  personAddOutline,
  personRemoveOutline,
  star
} from 'ionicons/icons';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap,
  tap
} from 'rxjs';

import { RawgGame } from '../../core/models/rawg.models';
import { FollowStats, ReviewItem, SocialPost, UserProfile } from '../../models';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { FollowService } from '../../core/services/follow.service';
import { GamesService } from '../../core/services/games.service';
import { ProfileService } from '../../core/services/profile.service';
import { SocialService } from '../../core/services/social.service';

type ActivityEntry =
  | (SocialPost & { kind: 'post' })
  | (ReviewItem & { kind: 'review' });

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonAvatar,
    IonButton,
    IonBadge,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
    IonText,
    IonTextarea,
    IonToast
  ],
  styleUrls: ['./profile.page.scss'],
  template: `
    <ion-content>
      <div class="page-shell page">

        <section class="surface-card profile-card" *ngIf="profile() as p">
          <ion-avatar class="avatar-circle big">
            <span>{{ p.avatar }}</span>
          </ion-avatar>
          <h1>{{ p.name }}</h1>
          <p class="muted" *ngIf="isMine()">{{ p.email }}</p>
          <ion-text color="medium">Juego favorito: {{ p.favoriteGame || '—' }}</ion-text>
          <p class="bio">{{ p.bio }}</p>

          <div class="stats">
            <div><strong>{{ stats().followers }}</strong><span>Followers</span></div>
            <div><strong>{{ stats().following }}</strong><span>Following</span></div>
            <div><strong>{{ userPosts().length }}</strong><span>Posts</span></div>
            <div><strong>{{ userReviews().length }}</strong><span>Reviews</span></div>
          </div>

          <div class="actions" *ngIf="!isMine()">
            <ion-button
              [fill]="stats().isFollowing ? 'outline' : 'solid'"
              [color]="stats().isFollowing ? 'medium' : 'primary'"
              (click)="toggleFollow()">
              <ion-icon
                slot="start"
                [name]="stats().isFollowing ? 'person-remove-outline' : 'person-add-outline'">
              </ion-icon>
              {{ stats().isFollowing ? 'Siguiendo' : 'Seguir' }}
            </ion-button>
            <ion-button color="primary" (click)="openChat()">
              <ion-icon slot="start" name="chatbubble-ellipses-outline"></ion-icon>
              Mensaje
            </ion-button>
          </div>
        </section>

        <section class="surface-card edit-card" *ngIf="isMine() && profile() as p">
          <h2>Editar perfil</h2>
          <ion-item>
            <ion-label position="stacked">Nombre</ion-label>
            <ion-input [(ngModel)]="editName"></ion-input>
          </ion-item>
          <div class="favorite-game-field">
            <ion-item>
              <ion-label position="stacked">Juego favorito</ion-label>
              <ion-input
                [(ngModel)]="editFavoriteGame"
                autocomplete="off"
                (ngModelChange)="onFavoriteGameInput($event)">
              </ion-input>
            </ion-item>

            <div class="game-suggestions" *ngIf="showFavoriteGameSuggestions()">
              <button
                type="button"
                class="game-suggestion"
                *ngFor="let game of favoriteGameSuggestions; trackBy: trackByGameId"
                (click)="selectFavoriteGame(game)">
                <span class="game-title">{{ game.name }}</span>
                <span class="game-meta">{{ game.released || 'Sin fecha' }}</span>
              </button>

              <div class="suggestion-state" *ngIf="favoriteGameSearchLoading">
                <ion-spinner name="crescent"></ion-spinner>
                <span>Buscando juegos...</span>
              </div>

              <div class="suggestion-state" *ngIf="!favoriteGameSearchLoading && !favoriteGameSuggestions.length && !favoriteGameSearchError">
                No hay juegos con ese nombre.
              </div>

              <div class="suggestion-state error" *ngIf="favoriteGameSearchError">
                {{ favoriteGameSearchError }}
              </div>
            </div>
          </div>
          <ion-item>
            <ion-label position="stacked">Bio</ion-label>
            <ion-textarea [(ngModel)]="editBio" autoGrow="true"></ion-textarea>
          </ion-item>
          <ion-button expand="block" [disabled]="saving" (click)="save()">
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </ion-button>
          <ion-button expand="block" fill="outline" color="danger" (click)="logout()">
            Cerrar sesion
          </ion-button>
          <ion-text color="danger" *ngIf="error()">{{ error() }}</ion-text>
        </section>

        <section class="surface-card activity-card" *ngIf="activity().length">
          <div class="activity-top">
            <div>
              <h2>Actividad</h2>
              <p class="activity-subtitle">Posts y reviews en una sola vista, con filtro rápido.</p>
            </div>
            <ion-segment [value]="activityFilter()" (ionChange)="setActivityFilter($event)">
              <ion-segment-button value="all">Todo</ion-segment-button>
              <ion-segment-button value="posts">Posts</ion-segment-button>
              <ion-segment-button value="reviews">Reviews</ion-segment-button>
            </ion-segment>
          </div>

          <div class="activity-list">
            <article class="activity-item" *ngFor="let item of activityShown(); trackBy: trackByActivity">
              <header [class.post-item]="item.kind === 'post'" [class.review-item]="item.kind === 'review'">
                <ion-badge [color]="item.kind === 'review' ? 'secondary' : 'primary'">
                  {{ item.kind === 'review' ? 'Review' : 'Post' }}
                </ion-badge>
                <strong *ngIf="item.kind === 'post'">{{ item.author }}</strong>
                <strong *ngIf="item.kind === 'review'">{{ item.game }} · {{ item.rating }}/10</strong>
                <small>{{ item.createdAt }}</small>
              </header>

              <p *ngIf="item.kind === 'post'">{{ item.content }}</p>
              <p *ngIf="item.kind === 'review'">{{ item.comment }}</p>

              <footer *ngIf="item.kind === 'post'" class="activity-meta">
                <small>{{ item.likes }} likes · {{ item.comments }} comentarios</small>
              </footer>
              <footer *ngIf="item.kind === 'review'" class="activity-meta review-meta">
                <ion-icon name="star"></ion-icon>
                <small>Reseña publicada</small>
              </footer>
            </article>
          </div>
        </section>

        <div class="loading" *ngIf="loading()">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      </div>

      <ion-toast
        [isOpen]="showSavedToast"
        message="Perfil actualizado."
        color="success"
        duration="1800"
        (didDismiss)="showSavedToast = false">
      </ion-toast>
    </ion-content>
  `
})
export class ProfilePage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly favoriteGameSearchTerms$ = new Subject<string>();

  readonly profile = signal<UserProfile | null>(null);
  readonly userPosts = signal<SocialPost[]>([]);
  readonly userReviews = signal<ReviewItem[]>([]);
  readonly activity = signal<ActivityEntry[]>([]);
  readonly activityFilter = signal<'all' | 'posts' | 'reviews'>('all');
  readonly activityShown = computed(() => {
    const filter = this.activityFilter();
    const items = this.activity();
    if (filter === 'posts') return items.filter((item) => item.kind === 'post');
    if (filter === 'reviews') return items.filter((item) => item.kind === 'review');
    return items;
  });
  readonly stats = signal<FollowStats>({ followers: 0, following: 0, isFollowing: false });
  readonly loading = signal(false);
  readonly error = signal('');
  readonly isMine = computed(() => {
    const me = this.auth.currentUser();
    return !!me && me.id === this.profile()?.id;
  });

  editName = '';
  editFavoriteGame = '';
  originalFavoriteGame = '';
  editBio = '';
  saving = false;
  showSavedToast = false;
  selectedFavoriteGame: RawgGame | null = null;
  favoriteGameSuggestions: RawgGame[] = [];
  favoriteGameSearchLoading = false;
  favoriteGameSearchError = '';
  favoriteGameSuggestionsOpen = false;

  constructor(
    private readonly auth: AuthService,
    private readonly profiles: ProfileService,
    private readonly social: SocialService,
    private readonly follows: FollowService,
    private readonly gamesService: GamesService,
    private readonly chat: ChatService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toastCtrl: ToastController
  ) {
    addIcons({ personAddOutline, personRemoveOutline, chatbubbleEllipsesOutline, star });

    // Sincroniza el formulario cuando cambia el perfil mostrado
    effect(() => {
      const p = this.profile();
      if (p && this.isMine()) {
        this.editName = p.name;
        this.editFavoriteGame = p.favoriteGame;
        this.originalFavoriteGame = p.favoriteGame;
        this.selectedFavoriteGame = null;
        this.favoriteGameSuggestions = [];
        this.favoriteGameSuggestionsOpen = false;
        this.editBio = p.bio;
      }
    });

    this.setupFavoriteGameSearch();
  }

  async ngOnInit(): Promise<void> {
    this.route.paramMap.subscribe(async (params) => {
      const userId = params.get('userId');
      await this.loadProfile(userId);
    });
  }

  onFavoriteGameInput(value: string): void {
    const cleanValue = value.trim();

    if (this.selectedFavoriteGame?.name !== cleanValue) {
      this.selectedFavoriteGame = null;
    }

    this.favoriteGameSuggestionsOpen = cleanValue.length >= 2;
    this.favoriteGameSearchTerms$.next(cleanValue);
  }

  selectFavoriteGame(game: RawgGame): void {
    this.selectedFavoriteGame = game;
    this.editFavoriteGame = game.name;
    this.favoriteGameSuggestions = [];
    this.favoriteGameSearchError = '';
    this.favoriteGameSuggestionsOpen = false;
  }

  showFavoriteGameSuggestions(): boolean {
    return (
      this.favoriteGameSuggestionsOpen &&
      Boolean(this.editFavoriteGame.trim()) &&
      !this.selectedFavoriteGame
    );
  }

  trackByGameId(_: number, game: RawgGame): number {
    return game.id;
  }

  trackByActivity(_: number, item: ActivityEntry): string {
    return `${item.kind}:${item.id}`;
  }

  setActivityFilter(event: CustomEvent): void {
    const value = event.detail?.value;
    if (value === 'all' || value === 'posts' || value === 'reviews') {
      this.activityFilter.set(value);
    }
  }

  private async loadProfile(userId: string | null): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      let target: UserProfile | null = null;
      if (!userId) {
        await this.auth.waitUntilReady();
        target = this.auth.currentUser();
      } else {
        target = await this.profiles.getProfile(userId);
      }
      if (!target) {
        this.error.set('Perfil no encontrado.');
        this.profile.set(null);
        return;
      }
      this.profile.set(target);

      const [posts, reviews, stats] = await Promise.all([
        this.social.getPostsByUser(target.id),
        this.social.getReviewsForUser(target.id),
        this.follows.getStats(target.id)
      ]);
      this.userPosts.set(posts);
      this.userReviews.set(reviews);
      this.activity.set([
        ...posts.map((post) => ({ ...post, kind: 'post' as const })),
        ...reviews.map((review) => ({ ...review, kind: 'review' as const }))
      ].sort((a, b) => (b.createdAtTimestamp ?? Date.now()) - (a.createdAtTimestamp ?? Date.now())));
      this.stats.set(stats);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el perfil.');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleFollow(): Promise<void> {
    const target = this.profile();
    if (!target) return;
    try {
      if (this.stats().isFollowing) {
        await this.follows.unfollow(target.id);
      } else {
        await this.follows.follow(target.id);
      }
      this.stats.set(await this.follows.getStats(target.id));
    } catch (e) {
      void this.toast(e instanceof Error ? e.message : 'Error', 'danger');
    }
  }

  async openChat(): Promise<void> {
    const target = this.profile();
    if (!target) return;
    try {
      const id = await this.chat.getOrCreatePrivateConversation(target.id);
      await this.router.navigate(['/tabs/social/chat', id]);
    } catch (e) {
      void this.toast(e instanceof Error ? e.message : 'Error', 'danger');
    }
  }

  async save(): Promise<void> {
    const current = this.profile();
    if (!current || !this.isMine()) return;

    const cleanFavoriteGame = this.editFavoriteGame.trim();
    const favoriteGameChanged =
      cleanFavoriteGame.toLowerCase() !== this.originalFavoriteGame.trim().toLowerCase();

    if (favoriteGameChanged && cleanFavoriteGame && !this.selectedFavoriteGame) {
      this.error.set('Selecciona el juego favorito del desplegable para confirmar que existe.');
      return;
    }

    this.saving = true;
    this.error.set('');
    try {
      await this.auth.updateProfile({
        name: this.editName,
        favoriteGame: this.editFavoriteGame,
        bio: this.editBio
      });
      const updated = this.auth.currentUser();
      if (updated) this.profile.set(updated);
      this.showSavedToast = true;
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      this.saving = false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.auth.logout();
      await this.router.navigateByUrl('/login');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cerrar sesion.');
    }
  }

  private async toast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2200, color, position: 'top' });
    await t.present();
  }

  private setupFavoriteGameSearch(): void {
    this.favoriteGameSearchTerms$
      .pipe(
        map((term) => term.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        tap((term) => {
          this.favoriteGameSearchError = '';

          if (term.length < 2) {
            this.favoriteGameSuggestions = [];
            this.favoriteGameSearchLoading = false;
            this.favoriteGameSuggestionsOpen = false;
            return;
          }

          this.favoriteGameSearchLoading = true;
        }),
        switchMap((term) => {
          if (term.length < 2) {
            return of([]);
          }

          return this.gamesService.searchGames(term, 1, 8).pipe(
            map((page) => page.items),
            catchError((error: Error) => {
              this.favoriteGameSearchError = error.message;
              return of([]);
            }),
            finalize(() => {
              this.favoriteGameSearchLoading = false;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((games) => {
        this.favoriteGameSuggestions = games;
      });
  }
}
