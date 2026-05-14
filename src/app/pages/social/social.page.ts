import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton
} from '@ionic/angular/standalone';

import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonSegment,
    IonSegmentButton
  ],
  styleUrls: ['./social.page.scss'],
  template: `
    <ion-content>
      <div class="page-shell page">
        <section class="surface-card chat-card">
          <h1>Chat personal y grupal</h1>
          <ion-segment [(ngModel)]="selectedRoomId">
            <ion-segment-button *ngFor="let room of chat.rooms()" [value]="room.id">
              <ion-label>{{ room.title }}</ion-label>
            </ion-segment-button>
          </ion-segment>

          <div class="messages">
            <article class="message" *ngFor="let message of currentMessages()">
              <strong>{{ message.sender }}</strong>
              <p>{{ message.content }}</p>
              <span>{{ message.createdAt }}</span>
            </article>
          </div>

          <ion-item>
            <ion-label position="stacked">Mensaje</ion-label>
            <ion-input [(ngModel)]="chatMessage" placeholder="Escribe aqui"></ion-input>
          </ion-item>
          <ion-button expand="block" (click)="sendMessage()">Enviar</ion-button>
        </section>
      </div>
    </ion-content>
  `
})
export class SocialPage {
  chatMessage = '';
  selectedRoomId = '';

  constructor(
    public readonly chat: ChatService,
    private readonly auth: AuthService
  ) {
    this.selectedRoomId = this.chat.rooms()[0]?.id ?? '';
  }

  sendMessage(): void {
    const user = this.auth.currentUser();
    if (!user || !this.selectedRoomId) {
      return;
    }

    this.chat.sendMessage(this.selectedRoomId, user.name, this.chatMessage);
    this.chatMessage = '';
  }

  currentMessages() {
    return this.chat.messages().filter((item: any) => item.roomId === this.selectedRoomId);
  }
}
