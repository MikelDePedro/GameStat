import { CommonModule } from '@angular/common';
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
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonText,
    IonTitle,
    IonToolbar
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page-shell auth-page">
        <section class="surface-card auth-card">
          <h1>Accede a tu cuenta</h1>
          <p>Usuario demo disponible: <strong>demo@gamestat.app</strong></p>

          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input [(ngModel)]="email" type="email" placeholder="demo@gamestat.app"></ion-input>
          </ion-item>

          <ion-button expand="block" (click)="submit()">Entrar</ion-button>
          <ion-text color="danger" *ngIf="error">{{ error }}</ion-text>

          <p class="muted">
            No tienes cuenta? <a routerLink="/register">Registrate</a>
          </p>
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
      width: min(100%, 420px);
      padding: 24px;
    }
    .muted {
      margin-top: 16px;
      color: #94a3b8;
    }
  `]
})
export class LoginPage {
  email = 'demo@gamestat.app';
  error = '';

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  submit(): void {
    this.error = '';
    const ok = this.auth.login(this.email);

    if (!ok) {
      this.error = 'No existe un usuario con ese email.';
      return;
    }

    void this.router.navigateByUrl('/tabs/home');
  }
}
