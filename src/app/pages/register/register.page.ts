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
  styleUrls: ['./register.page.scss'],
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
            <h1>Empieza hoy y manten el foco</h1>
            <p class="lead">Crea tu cuenta, configura tus habitos y descubre una forma mas divertida de medir constancia con tu gente.</p>

            <div class="hero-badges">
              <span class="badge">Configura en minutos</span>
              <span class="badge">Comparte logros</span>
              <span class="badge">Todo en una app</span>
            </div>
          </div>
        </section>

        <section class="surface-card auth-card">
          <h2>Crea tu cuenta</h2>
          <p class="helper">Empieza a registrar y compartir tus habitos.</p>

          <div class="form-fields">
            <ion-item class="form-item">
              <ion-label position="stacked">Nick</ion-label>
              <ion-input [(ngModel)]="form.name"></ion-input>
            </ion-item>
            <ion-item class="form-item">
              <ion-label position="stacked">Email</ion-label>
              <ion-input [(ngModel)]="form.email" type="email"></ion-input>
            </ion-item>
            <ion-item class="form-item">
              <ion-label position="stacked">Contraseña</ion-label>
              <ion-input [(ngModel)]="form.password" type="password"></ion-input>
            </ion-item>
            <ion-item class="form-item">
              <ion-label position="stacked">Repite contraseña</ion-label>
              <ion-input type="password"></ion-input>
            </ion-item>
          </div>

          <ion-button expand="block" class="primary-gradient" [disabled]="loading" (click)="submit()">
            {{ loading ? 'Creando cuenta...' : 'Registrarme' }}
          </ion-button>

          <ion-text color="success" *ngIf="message">
            <p class="feedback">{{ message }}</p>
          </ion-text>
          <ion-text color="danger" *ngIf="error">
            <p class="feedback">{{ error }}</p>
          </ion-text>

          <p class="muted">Ya tienes cuenta? <a routerLink="/login">Inicia sesion</a></p>
        </section>
      </div>
    </ion-content>
  `
})
export class RegisterPage {
  form = {
    name: '',
    email: '',
    password: '',
    favoriteGame: '',
    bio: ''
  };
  error = '';
  message = '';
  loading = false;

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  async submit(): Promise<void> {
    this.error = '';
    this.message = '';
    this.loading = true;

    try {
      const result = await this.auth.register(this.form);

      if (result.requiresEmailConfirmation) {
        this.form.password = '';
        this.message =
          'Cuenta creada. Revisa tu email para confirmar la cuenta antes de iniciar sesion.';
        return;
      }

      await this.router.navigateByUrl('/tabs/home');
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo crear la cuenta.';
    } finally {
      this.loading = false;
    }
  }
}
