import { Component } from '@angular/core';
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubblesOutline,
  gameControllerOutline,
  homeOutline,
  personCircleOutline,
  starOutline
} from 'ionicons/icons';

@Component({
  standalone: true,
  imports: [IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs],
  styleUrls: ['./tabs.page.scss'],
  template: `
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>

      <ion-tab-bar slot="top">
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="review" href="/tabs/review">
          <ion-icon name="star-outline"></ion-icon>
          <ion-label>Review</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="games" href="/tabs/games">
          <ion-icon name="game-controller-outline"></ion-icon>
          <ion-label>Juegos</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="social" href="/tabs/social">
          <ion-icon name="chatbubbles-outline"></ion-icon>
          <ion-label>Social</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" href="/tabs/profile">
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
      gameControllerOutline,
      chatbubblesOutline,
      personCircleOutline
    });
  }
}
