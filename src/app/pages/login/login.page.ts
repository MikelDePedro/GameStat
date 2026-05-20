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
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-title>GameStat</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell auth-layout">
        <section class="surface-card auth-hero">
          <div class="hero-inner">
            <p class="eyebrow">HABITOSGALI</p>
            <h1>Convierte tus habitos en progreso real</h1>
            <p class="lead">Entra a tu panel social, revisa tus rachas y comparte avances con tus amigos en una experiencia mas visual.</p>

            <div class="hero-badges">
              <span class="badge">Rachas dinamicas</span>
              <span class="badge">Registros sociales</span>
              <span class="badge">Estadisticas</span>
            </div>
          </div>
        </section>

        <section class="surface-card auth-card">
          <h2>Bienvenido de vuelta</h2>
          <p class="helper">Accede a tus habitos y registros sociales.</p>

          <div class="form-fields">
            <ion-item class="form-item">
              <ion-label position="stacked">Nick o email</ion-label>
              <ion-input [(ngModel)]="email" type="email" placeholder=""></ion-input>
            </ion-item>

            <ion-item class="form-item">
              <ion-label position="stacked">Contraseña</ion-label>
              <ion-input [(ngModel)]="password" type="password" placeholder=""></ion-input>
            </ion-item>
          </div>

          <div class="actions-row">
            <a class="forgot" routerLink="/forgot">He olvidado mi contraseña</a>
            <ion-button expand="block" class="primary-gradient" [disabled]="loading" (click)="submit()">
              {{ loading ? 'Entrando...' : 'Entrar' }}
            </ion-button>
          </div>

          <ion-text color="danger" *ngIf="error">
            <p class="feedback">{{ error }}</p>
          </ion-text>

          <p class="muted">No tienes cuenta? <a routerLink="/register">Registrate</a></p>
        </section>
      </div>
    </ion-content>
  `
})
export class LoginPage {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  async submit(): Promise<void> {
    this.error = '';
    this.loading = true;

    try {
      await this.auth.login(this.email, this.password);
      await this.router.navigateByUrl('/tabs/home');
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo iniciar sesion.';
    } finally {
      this.loading = false;
    }
  }
}
