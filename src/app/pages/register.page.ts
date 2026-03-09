import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonTitle,
    IonToolbar
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Registro</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page-shell auth-page">
        <section class="surface-card auth-card">
          <h1>Crea tu cuenta</h1>

          <ion-item>
            <ion-label position="stacked">Nombre</ion-label>
            <ion-input [(ngModel)]="form.name"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input [(ngModel)]="form.email" type="email"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Juego favorito</ion-label>
            <ion-input [(ngModel)]="form.favoriteGame"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Bio</ion-label>
            <ion-input [(ngModel)]="form.bio"></ion-input>
          </ion-item>

          <ion-button expand="block" (click)="submit()">Crear cuenta</ion-button>
          <p class="muted">Ya tienes cuenta? <a routerLink="/login">Inicia sesion</a></p>
        </section>
      </div>
    </ion-content>
  `,
  styles: [`
    .auth-page {
      display: grid;
      place-items: center;
      min-height: 100%;
      padding: 24px;
    }
    .auth-card {
      width: min(100%, 460px);
      padding: 24px;
    }
    .muted {
      margin-top: 16px;
      color: #94a3b8;
    }
  `]
})
export class RegisterPage {
  form = {
    name: '',
    email: '',
    favoriteGame: '',
    bio: ''
  };

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  submit(): void {
    this.auth.register({
      ...this.form,
      avatar: this.initials(this.form.name)
    });

    void this.router.navigateByUrl('/tabs/home');
  }

  private initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase() ?? '')
      .join('');
  }
}
