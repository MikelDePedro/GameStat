import { CommonModule } from '@angular/common';
import { Component, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonText,
  IonToast
} from '@ionic/angular/standalone';

import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
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
    IonText,
    IonToast
  ],
  styleUrls: ['./profile.page.scss'],
  template: `
    <ion-content>
      <div class="page-shell page">
        <section class="surface-card profile-card">
          <div class="avatar">{{ profile.avatar }}</div>
          <h1>{{ profile.name }}</h1>
          <p>{{ profile.email }}</p>
          <ion-text color="medium">Juego favorito: {{ profile.favoriteGame }}</ion-text>
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

        <section class="surface-card edit-card">
          <h2>Editar perfil</h2>
          <ion-item>
            <ion-label position="stacked">Nombre</ion-label>
            <ion-input [(ngModel)]="profile.name"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Juego favorito</ion-label>
            <ion-input [(ngModel)]="profile.favoriteGame"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Bio</ion-label>
            <ion-input [(ngModel)]="profile.bio"></ion-input>
          </ion-item>

          <ion-button expand="block" [disabled]="loading" (click)="save()">
            {{ loading ? 'Guardando...' : 'Guardar cambios' }}
          </ion-button>
          <ion-button expand="block" fill="outline" color="danger" [disabled]="loading" (click)="logout()">
            Cerrar sesion
          </ion-button>
          <ion-text color="danger" *ngIf="error">{{ error }}</ion-text>
        </section>
      </div>

      <ion-toast
        [isOpen]="showSavedToast"
        message="Perfil actualizado en Supabase."
        color="success"
        duration="1800"
        (didDismiss)="showSavedToast = false">
      </ion-toast>
    </ion-content>
  `
})
export class ProfilePage {
  profile = {
    id: '',
    name: '',
    email: '',
    favoriteGame: '',
    bio: '',
    avatar: ''
  };
  loading = false;
  error = '';
  showSavedToast = false;
  readonly stats = computed(() => ({
    reviews: this.social.reviews().length,
    posts: this.social.posts().length,
    rooms: this.chat.rooms().length
  }));

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly social: SocialService,
    private readonly chat: ChatService
  ) {
    effect(() => {
      const currentUser = this.auth.currentUser();
      if (!currentUser) {
        return;
      }

      this.profile = { ...currentUser };
    });
  }

  async save(): Promise<void> {
    this.error = '';
    this.loading = true;
    this.profile.avatar = this.profile.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase() ?? '')
      .join('');

    try {
      await this.auth.updateProfile(this.profile);
      this.showSavedToast = true;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo guardar el perfil.';
    } finally {
      this.loading = false;
    }
  }

  async logout(): Promise<void> {
    this.error = '';
    this.loading = true;

    try {
      await this.auth.logout();
      await this.router.navigateByUrl('/login');
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo cerrar sesion.';
    } finally {
      this.loading = false;
    }
  }
}
