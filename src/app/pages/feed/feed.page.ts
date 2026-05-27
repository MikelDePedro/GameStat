import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonAvatar,
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTextarea,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubbleOutline,
  heart,
  heartOutline,
  refreshOutline,
  trashOutline
} from 'ionicons/icons';

import { SocialComment, SocialPost } from '../../models';
import { AuthService } from '../../core/services/auth.service';
import { SocialService } from '../../core/services/social.service';
import { EmptyStateComponent } from '../../shared';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    EmptyStateComponent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonAvatar,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
    IonTextarea
  ],
  styleUrls: ['./feed.page.scss'],
  template: `
    <ion-content>
      <div class="page-shell feed-shell">

        <section class="surface-card composer-card">
          <header class="feed-header">
            <p class="eyebrow">Feed social</p>
            <h1>Comparte con tu comunidad</h1>
          </header>
          <ion-item lines="none">
            <ion-textarea
              [(ngModel)]="postContent"
              placeholder="Que estas jugando hoy?"
              autoGrow="true"
              maxlength="500">
            </ion-textarea>
          </ion-item>
          <div class="actions">
            <span class="char-count">{{ postContent.length }}/500</span>
            <ion-button (click)="publishPost()" [disabled]="publishing()">
              {{ publishing() ? 'Publicando...' : 'Publicar' }}
            </ion-button>
          </div>
        </section>

        <section class="surface-card feed-list-card">
          <header class="feed-header">
            <h2>Ultimos posts</h2>
            <ion-button fill="clear" (click)="refresh()">
              <ion-icon slot="icon-only" name="refresh-outline"></ion-icon>
            </ion-button>
          </header>

          <div class="loading" *ngIf="social.loadingPosts()">
            <ion-spinner name="crescent"></ion-spinner>
          </div>

          <app-empty-state
            *ngIf="!social.loadingPosts() && social.posts().length === 0"
            title="Aun no hay posts"
            message="Se el primero en compartir algo con la comunidad.">
          </app-empty-state>

          <ion-list lines="none" class="posts">
            <article
              class="post-card"
              *ngFor="let post of social.posts(); trackBy: trackById">
              <header>
                <ion-avatar class="avatar-circle" [routerLink]="['/profile', post.userId]">
                  <span>{{ post.authorAvatar }}</span>
                </ion-avatar>
                <div class="meta">
                  <strong [routerLink]="['/profile', post.userId]">{{ post.author }}</strong>
                  <span>{{ post.createdAt }}</span>
                </div>
                <ion-button
                  fill="clear"
                  color="medium"
                  *ngIf="post.userId === currentUserId()"
                  (click)="deletePost(post)">
                  <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                </ion-button>
              </header>
              <p class="content">{{ post.content }}</p>
              <footer>
                <ion-button fill="clear" size="small" (click)="toggleLike(post)">
                  <ion-icon slot="start" [name]="post.liked ? 'heart' : 'heart-outline'"
                            [color]="post.liked ? 'danger' : 'medium'"></ion-icon>
                  {{ post.likes }}
                </ion-button>
                <ion-button fill="clear" size="small" (click)="toggleComments(post)">
                  <ion-icon slot="start" name="chatbubble-outline"></ion-icon>
                  {{ post.comments }}
                </ion-button>
              </footer>

              <div class="comments" *ngIf="openedCommentsFor() === post.id">
                <div class="loading" *ngIf="loadingComments()">
                  <ion-spinner name="crescent"></ion-spinner>
                </div>
                <article class="comment" *ngFor="let c of commentsList()">
                  <ion-avatar class="avatar-circle small"><span>{{ c.authorAvatar }}</span></ion-avatar>
                  <div>
                    <strong>{{ c.author }}</strong>
                    <small>{{ c.createdAt }}</small>
                    <p>{{ c.content }}</p>
                  </div>
                </article>
                <ion-item lines="none" class="comment-composer">
                  <ion-input
                    [(ngModel)]="commentDraft"
                    placeholder="Escribe un comentario..."
                    (keydown.enter)="submitComment(post)">
                  </ion-input>
                  <ion-button slot="end" (click)="submitComment(post)" [disabled]="sendingComment()">
                    Enviar
                  </ion-button>
                </ion-item>
              </div>
            </article>
          </ion-list>

          <ion-infinite-scroll
            threshold="120px"
            [disabled]="!social.hasMore() || social.loadingMore()"
            (ionInfinite)="loadMore($event)">
            <ion-infinite-scroll-content loadingSpinner="crescent" loadingText="Cargando mas posts..."></ion-infinite-scroll-content>
          </ion-infinite-scroll>
        </section>
      </div>
    </ion-content>
  `
})
export class FeedPage {
  postContent = '';
  commentDraft = '';
  readonly publishing = signal(false);
  readonly openedCommentsFor = signal<string | null>(null);
  readonly commentsList = signal<SocialComment[]>([]);
  readonly loadingComments = signal(false);
  readonly sendingComment = signal(false);

  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? '');

  constructor(
    public readonly social: SocialService,
    private readonly auth: AuthService,
    private readonly toastCtrl: ToastController,
    private readonly alertCtrl: AlertController
  ) {
    addIcons({ heart, heartOutline, chatbubbleOutline, trashOutline, refreshOutline });
  }

  trackById(_: number, p: SocialPost): string {
    return p.id;
  }

  refresh(): void {
    void this.social.loadPosts();
  }

  async loadMore(event: CustomEvent): Promise<void> {
    try {
      await this.social.loadMoreFeed();
    } finally {
      (event.target as HTMLIonInfiniteScrollElement | null)?.complete();
    }
  }

  async publishPost(): Promise<void> {
    if (!this.postContent.trim()) return;
    this.publishing.set(true);
    try {
      await this.social.createPost(this.postContent);
      this.postContent = '';
    } catch (e) {
      void this.toast(e instanceof Error ? e.message : 'No se pudo publicar.', 'danger');
    } finally {
      this.publishing.set(false);
    }
  }

  async toggleLike(post: SocialPost): Promise<void> {
    try {
      await this.social.toggleLike(post.id);
    } catch (e) {
      void this.toast(e instanceof Error ? e.message : 'No se pudo dar like.', 'danger');
    }
  }

  async deletePost(post: SocialPost): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Borrar post',
      message: '¿Seguro que quieres borrar este post?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Borrar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.social.deletePost(post.id);
            } catch (e) {
              void this.toast(e instanceof Error ? e.message : 'Error', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async toggleComments(post: SocialPost): Promise<void> {
    if (this.openedCommentsFor() === post.id) {
      this.openedCommentsFor.set(null);
      this.commentsList.set([]);
      return;
    }
    this.openedCommentsFor.set(post.id);
    this.loadingComments.set(true);
    try {
      this.commentsList.set(await this.social.getComments(post.id));
    } catch (e) {
      void this.toast(e instanceof Error ? e.message : 'No se pudieron cargar los comentarios.', 'danger');
    } finally {
      this.loadingComments.set(false);
    }
  }

  async submitComment(post: SocialPost): Promise<void> {
    if (!this.commentDraft.trim()) return;
    this.sendingComment.set(true);
    try {
      const c = await this.social.addComment(post.id, this.commentDraft);
      this.commentsList.update((items) => [...items, c]);
      this.commentDraft = '';
    } catch (e) {
      void this.toast(e instanceof Error ? e.message : 'Error', 'danger');
    } finally {
      this.sendingComment.set(false);
    }
  }

  private async toast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2200, color, position: 'top' });
    await t.present();
  }
}
