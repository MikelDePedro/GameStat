import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [
    FormsModule,
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonText
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

          <ion-button expand="block" (click)="save()">Guardar cambios</ion-button>
          <ion-button expand="block" fill="outline" color="danger" (click)="logout()">Cerrar sesion</ion-button>
        </section>
      </div>
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

  constructor(private readonly auth: AuthService, private readonly router: Router) {
    this.profile = {
      ...(this.auth.currentUser() ?? this.profile)
    };
  }

  save(): void {
    this.profile.avatar = this.profile.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase() ?? '')
      .join('');

    this.auth.updateProfile(this.profile);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
