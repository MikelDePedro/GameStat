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

import { AuthService } from '../../core/services/auth.service';

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
  styleUrls: ['./login.page.scss'],
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
          <p>Usuario demo disponible: <strong>demo&#64;gamestat.app</strong></p>

          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input [(ngModel)]="email" type="email" placeholder="demo&#64;gamestat.app"></ion-input>
          </ion-item>

          <ion-button expand="block" (click)="submit()">Entrar</ion-button>
          <ion-text color="danger" *ngIf="error">{{ error }}</ion-text>

          <p class="muted">
            No tienes cuenta? <a routerLink="/register">Registrate</a>
          </p>
        </section>
      </div>
    </ion-content>
  `
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
