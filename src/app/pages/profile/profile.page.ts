import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonAvatar,
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonTextarea,
  IonToast,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubbleEllipsesOutline,
  personAddOutline,
  personRemoveOutline
} from 'ionicons/icons';

import { FollowStats, ReviewItem, SocialPost, UserProfile } from '../../models';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { FollowService } from '../../core/services/follow.service';
import { ProfileService } from '../../core/services/profile.service';
import { SocialService } from '../../core/services/social.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonAvatar,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonSpinner,
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
          <ion-item>
            <ion-label position="stacked">Juego favorito</ion-label>
            <ion-input [(ngModel)]="editFavoriteGame"></ion-input>
          </ion-item>
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

        <section class="surface-card posts-card" *ngIf="userPosts().length">
          <h2>Posts</h2>
          <article class="mini-post" *ngFor="let post of userPosts()">
            <p>{{ post.content }}</p>
            <small>{{ post.createdAt }} · {{ post.likes }} likes · {{ post.comments }} comentarios</small>
          </article>
        </section>

        <section class="surface-card posts-card" *ngIf="userReviews().length">
          <h2>Reviews</h2>
          <article class="mini-post" *ngFor="let r of userReviews()">
            <strong>{{ r.game }} — {{ r.rating }}/10</strong>
            <p>{{ r.comment }}</p>
            <small>{{ r.createdAt }}</small>
          </article>
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
  readonly profile = signal<UserProfile | null>(null);
  readonly userPosts = signal<SocialPost[]>([]);
  readonly userReviews = signal<ReviewItem[]>([]);
  readonly stats = signal<FollowStats>({ followers: 0, following: 0, isFollowing: false });
  readonly loading = signal(false);
  readonly error = signal('');
  readonly isMine = computed(() => {
    const me = this.auth.currentUser();
    return !!me && me.id === this.profile()?.id;
  });

  editName = '';
  editFavoriteGame = '';
  editBio = '';
  saving = false;
  showSavedToast = false;

  constructor(
    private readonly auth: AuthService,
    private readonly profiles: ProfileService,
    private readonly social: SocialService,
    private readonly follows: FollowService,
    private readonly chat: ChatService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toastCtrl: ToastController
  ) {
    addIcons({ personAddOutline, personRemoveOutline, chatbubbleEllipsesOutline });

    // Sincroniza el formulario cuando cambia el perfil mostrado
    effect(() => {
      const p = this.profile();
      if (p && this.isMine()) {
        this.editName = p.name;
        this.editFavoriteGame = p.favoriteGame;
        this.editBio = p.bio;
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.route.paramMap.subscribe(async (params) => {
      const userId = params.get('userId');
      await this.loadProfile(userId);
    });
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
}
