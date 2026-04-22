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
            <ion-label position="stacked">Contrasena</ion-label>
            <ion-input [(ngModel)]="form.password" type="password" placeholder="Minimo 6 caracteres"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Juego favorito</ion-label>
            <ion-input [(ngModel)]="form.favoriteGame"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Bio</ion-label>
            <ion-input [(ngModel)]="form.bio"></ion-input>
          </ion-item>

          <ion-button expand="block" [disabled]="loading" (click)="submit()">
            {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
          </ion-button>
          <ion-text color="success" *ngIf="message">{{ message }}</ion-text>
          <ion-text color="danger" *ngIf="error">{{ error }}</ion-text>
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
