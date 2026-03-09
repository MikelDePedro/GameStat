import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubblesOutline, homeOutline, personCircleOutline, starOutline } from 'ionicons/icons';

@Component({
  standalone: true,
  imports: [RouterLink, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs],
  template: `
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>

      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" [routerLink]="['/tabs/home']">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="review" [routerLink]="['/tabs/review']">
          <ion-icon name="star-outline"></ion-icon>
          <ion-label>Review</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="social" [routerLink]="['/tabs/social']">
          <ion-icon name="chatbubbles-outline"></ion-icon>
          <ion-label>Social</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" [routerLink]="['/tabs/profile']">
          <ion-icon name="person-circle-outline"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `
})
export class TabsPage {
  constructor() {
    addIcons({
      homeOutline,
      starOutline,
      chatbubblesOutline,
      personCircleOutline
    });
  }
}
