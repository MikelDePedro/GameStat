import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import { AuthService } from '../core/services/auth.service';
import { ChatService } from '../core/services/chat.service';
import { SocialService } from '../core/services/social.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Social</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page-shell page">
        <section class="surface-card post-box">
          <h1>Feed social</h1>
          <ion-item>
            <ion-label position="stacked">Nuevo post</ion-label>
            <ion-input [(ngModel)]="postContent" placeholder="Comparte algo con la comunidad"></ion-input>
          </ion-item>
          <ion-button expand="block" (click)="publishPost()">Publicar</ion-button>
        </section>

        <ion-list class="surface-card feed-list">
          <ion-item lines="none" *ngFor="let post of social.posts()">
            <ion-label>
              <h2>{{ post.author }}</h2>
              <p>{{ post.content }}</p>
              <p>{{ post.createdAt }} - {{ post.likes }} likes</p>
            </ion-label>
            <ion-button fill="clear" (click)="social.likePost(post.id)">Like</ion-button>
          </ion-item>
        </ion-list>

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
  `,
  styles: [`
    .page {
      padding: 20px 20px 88px;
    }
    .post-box,
    .feed-list,
    .chat-card {
      padding: 20px;
    }
    .feed-list,
    .chat-card {
      margin-top: 20px;
    }
    .messages {
      display: grid;
      gap: 12px;
      margin: 18px 0;
    }
    .message {
      padding: 14px;
      border-radius: 16px;
      background: rgba(30, 41, 59, 0.75);
    }
    .message p,
    .message span {
      margin: 6px 0 0;
      color: #cbd5e1;
    }
    .message span {
      font-size: 12px;
      color: #94a3b8;
    }
  `]
})
export class SocialPage {
  postContent = '';
  chatMessage = '';
  selectedRoomId = '';

  constructor(
    public readonly social: SocialService,
    public readonly chat: ChatService,
    private readonly auth: AuthService
  ) {
    this.selectedRoomId = this.chat.rooms()[0]?.id ?? '';
  }

  publishPost(): void {
    const user = this.auth.currentUser();
    if (!user || !this.postContent.trim()) {
      return;
    }

    this.social.addPost({
      id: crypto.randomUUID(),
      author: user.name,
      content: this.postContent.trim(),
      likes: 0,
      createdAt: 'Ahora'
    });

    this.postContent = '';
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
    return this.chat.messages().filter((item) => item.roomId === this.selectedRoomId);
  }
}
