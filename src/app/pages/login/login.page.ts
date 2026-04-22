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
          <p>Tu acceso ahora usa autenticacion real de Supabase.</p>

          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input [(ngModel)]="email" type="email" placeholder="tuemail@dominio.com"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Contrasena</ion-label>
            <ion-input [(ngModel)]="password" type="password" placeholder="Minimo 6 caracteres"></ion-input>
          </ion-item>

          <ion-button expand="block" [disabled]="loading" (click)="submit()">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </ion-button>
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
