import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  InfiniteScrollCustomEvent,
  IonButton,
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList
} from '@ionic/angular/standalone';

import { SocialPost } from '../../models';
import { AuthService } from '../../core/services/auth.service';
import { SocialService } from '../../core/services/social.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonInput,
    IonItem,
    IonLabel,
    IonList
  ],
  styleUrls: ['./feed.page.scss'],
  template: `
    <ion-content [scrollY]="false">
      <div class="page-shell page">
        <section class="surface-card feed-section">
          <div class="feed-scroll ion-content-scroll-host">
            <ion-list class="feed-list">
              <ion-item lines="none" *ngFor="let post of visiblePosts(); trackBy: trackByPostId">
                <ion-label>
                  <h2>{{ post.author }}</h2>
                  <p>{{ post.content }}</p>
                  <p>{{ post.createdAt }} - {{ post.likes }} likes</p>
                </ion-label>
                <ion-button
                  fill="outline"
                  [disabled]="hasLikedPost(post.id)"
                  (click)="likePost(post.id)">
                  {{ hasLikedPost(post.id) ? 'Liked' : 'Like' }}
                </ion-button>
              </ion-item>
            </ion-list>

            <ion-infinite-scroll
              threshold="80px"
              [disabled]="allPostsLoaded()"
              (ionInfinite)="onIonInfinite($event)">
              <ion-infinite-scroll-content
                loadingSpinner="crescent"
                loadingText="Cargando posts...">
              </ion-infinite-scroll-content>
            </ion-infinite-scroll>
          </div>
        </section>

        <section class="surface-card post-box">
          <h1>Feed social</h1>
          <ion-item>
            <ion-label position="stacked">Nuevo post</ion-label>
            <ion-input [(ngModel)]="postContent" placeholder="Comparte algo con la comunidad"></ion-input>
          </ion-item>
          <ion-button expand="block" (click)="publishPost()">Publicar</ion-button>
        </section>
      </div>
    </ion-content>
  `
})
export class FeedPage {
  private readonly pageSize = 6;

  postContent = '';
  visibleCount = signal(this.pageSize);
  readonly orderedPosts = computed(() =>
    [...this.social.posts()].sort((first, second) => second.createdAtTimestamp - first.createdAtTimestamp)
  );
  readonly visiblePosts = computed(() => this.orderedPosts().slice(0, this.visibleCount()));
  readonly allPostsLoaded = computed(() => this.visibleCount() >= this.orderedPosts().length);

  constructor(
    private readonly auth: AuthService,
    public readonly social: SocialService
  ) {}

  trackByPostId(_: number, post: SocialPost): string {
    return post.id;
  }

  publishPost(): void {
    const user = this.auth.currentUser();
    if (!user || !this.postContent.trim()) {
      return;
    }

    this.social.addPost({
      id: crypto.randomUUID(),
      author: user.name,
      content: this.postContent.trim(),
      likes: 0,
      createdAt: 'Ahora',
      createdAtTimestamp: Date.now()
    });

    this.postContent = '';
  }

  likePost(postId: string): void {
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }

    this.social.likePost(postId, user.id);
  }

  hasLikedPost(postId: string): boolean {
    const user = this.auth.currentUser();
    return user ? this.social.hasLikedPost(postId, user.id) : false;
  }

  onIonInfinite(event: InfiniteScrollCustomEvent): void {
    this.visibleCount.update((count) =>
      Math.min(count + this.pageSize, this.orderedPosts().length)
    );

    setTimeout(() => {
      event.target.complete();
    }, 300);
  }
}
