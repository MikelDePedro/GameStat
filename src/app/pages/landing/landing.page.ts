import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

@Component({
  standalone: true,
  imports: [RouterLink, IonButton, IonContent, IonHeader, IonTitle, IonToolbar],
  styleUrls: ['./landing.page.scss'],
  template: `
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-title>GameStat</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell landing">
        <section class="hero surface-card">
          <p class="eyebrow">Comunidad, metricas y chat gamer</p>
          <h1>Una app Ionic + Angular con autenticacion, tabs y espacio social.</h1>
          <p>
            Esta landing sirve como punto de entrada a la app: acceso a login, registro y resumen
            de funcionalidades clave.
          </p>

          <div class="actions">
            <ion-button routerLink="/login">Iniciar sesion</ion-button>
            <ion-button routerLink="/register" fill="outline">Crear cuenta</ion-button>
          </div>
        </section>

        <section class="card-grid feature-grid">
          <article class="surface-card feature">
            <h2>Home</h2>
            <p>KPIs, actividad reciente y acceso rapido a partidas, reviews y comunidad.</p>
          </article>
          <article class="surface-card feature">
            <h2>Perfil</h2>
            <p>Datos del jugador, juego favorito, bio y edicion rapida de perfil.</p>
          </article>
          <article class="surface-card feature">
            <h2>Review + Social</h2>
            <p>Resenas de juegos, feed de publicaciones y chat personal o grupal.</p>
          </article>
        </section>
      </div>
    </ion-content>
  `
})
export class LandingPage {}
