import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ellipsisVertical, sendOutline } from 'ionicons/icons';

import { ChatMessage, Conversation } from '../../models';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonAvatar,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonInput,
    IonSpinner,
    IonText,
    IonTitle,
    IonToolbar
  ],
  styleUrls: ['./chat-detail.page.scss'],
  template: `
    <ion-header>
      <ion-toolbar color="dark">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/social"></ion-back-button>
        </ion-buttons>
        <ion-title>
          <div class="title-row" *ngIf="conversation() as conv">
            <ion-avatar class="avatar-circle">
              <span>{{ conv.avatar }}</span>
            </ion-avatar>
            <div class="title-text">
              <strong>{{ conv.title }}</strong>
              <small>
                {{ conv.type === 'group' ? conv.participants.length + ' miembros' : 'Chat privado' }}
              </small>
            </div>
          </div>
        </ion-title>
        <ion-buttons slot="end" *ngIf="conversation()?.type === 'group'">
          <ion-button (click)="openGroupOptions()">
            <ion-icon slot="icon-only" name="ellipsis-vertical"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [scrollEvents]="true">
      <div class="chat-shell" #scrollContainer>
        <ion-text color="danger" *ngIf="errorMessage()">
          <p class="error">{{ errorMessage() }}</p>
        </ion-text>

        <div class="loading" *ngIf="loading()">
          <ion-spinner name="crescent"></ion-spinner>
        </div>

        <div
          *ngFor="let msg of messages(); trackBy: trackById"
          class="message"
          [class.own]="msg.senderId === currentUserId()">
          <ion-avatar class="avatar-circle small">
            <span>{{ msg.senderAvatar }}</span>
          </ion-avatar>
          <div class="bubble">
            <header>
              <strong [routerLink]="['/profile', msg.senderId]" class="sender-name">
                {{ msg.senderName }}
              </strong>
              <span>{{ msg.createdAt }}</span>
            </header>
            <p>{{ msg.content }}</p>
          </div>
        </div>

        <p class="empty" *ngIf="!loading() && messages().length === 0">
          Aun no hay mensajes. Empieza la conversacion!
        </p>
      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar color="dark">
        <div class="composer">
          <ion-input
            [(ngModel)]="draft"
            placeholder="Escribe un mensaje..."
            (keydown.enter)="send()"
            [disabled]="sending()">
          </ion-input>
          <ion-button
            (click)="send()"
            [disabled]="sending() || !draft.trim()"
            shape="round">
            <ion-icon slot="icon-only" name="send-outline"></ion-icon>
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  `
})
export class ChatDetailPage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  readonly conversationId = signal('');
  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly errorMessage = signal('');
  draft = '';

  readonly messages = computed<ChatMessage[]>(() =>
    this.chat.messagesFor(this.conversationId())
  );
  readonly conversation = computed<Conversation | undefined>(() =>
    this.chat.getConversation(this.conversationId())
  );
  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? '');

  private unsubscribe?: () => void;
  private prevMessageCount = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly chat: ChatService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly toastCtrl: ToastController,
    private readonly alertCtrl: AlertController
  ) {
    addIcons({ sendOutline, ellipsisVertical });
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('conversationId') ?? '';
    if (!id) {
      this.errorMessage.set('Conversacion invalida.');
      return;
    }
    this.conversationId.set(id);

    // Asegurarnos de tener metadatos de la conversación
    if (!this.chat.getConversation(id)) {
      await this.chat.loadConversations().catch(() => undefined);
    }

    this.loading.set(true);
    try {
      await this.chat.loadMessages(id);
    } catch (e) {
      this.errorMessage.set(e instanceof Error ? e.message : 'No se pudo cargar el chat.');
    } finally {
      this.loading.set(false);
    }

    this.unsubscribe = this.chat.subscribeToConversation(id);
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }

  ngAfterViewChecked(): void {
    const count = this.messages().length;
    if (count !== this.prevMessageCount) {
      this.prevMessageCount = count;
      requestAnimationFrame(() => this.scrollToBottom());
    }
  }

  trackById(_: number, m: ChatMessage): string {
    return m.id;
  }

  async send(): Promise<void> {
    const content = this.draft.trim();
    if (!content) return;
    this.sending.set(true);
    try {
      await this.chat.sendMessage(this.conversationId(), content);
      this.draft = '';
    } catch (e) {
      void this.showToast(e instanceof Error ? e.message : 'Error', 'danger');
    } finally {
      this.sending.set(false);
    }
  }

  async openGroupOptions(): Promise<void> {
    const conv = this.conversation();
    const me = this.auth.currentUser();
    if (!conv || !me) return;

    const isAdmin = conv.participants.some((p) => p.userId === me.id && p.role === 'admin');

    const alert = await this.alertCtrl.create({
      header: conv.title,
      message:
        'Miembros:\n' +
        conv.participants.map((p) => `• ${p.name}${p.role === 'admin' ? ' (admin)' : ''}`).join('\n'),
      buttons: [
        { text: 'Abandonar grupo', role: 'destructive', handler: () => this.leaveGroup() },
        ...(isAdmin
          ? [{ text: 'Anadir miembro', handler: () => this.promptAddMember() }]
          : []),
        { text: 'Cerrar', role: 'cancel' }
      ]
    });
    await alert.present();
  }

  private async leaveGroup(): Promise<void> {
    const me = this.auth.currentUser();
    const convId = this.conversationId();
    if (!me || !convId) return;
    try {
      await this.chat.removeGroupMember(convId, me.id);
      await this.router.navigateByUrl('/tabs/social');
    } catch (e) {
      void this.showToast(e instanceof Error ? e.message : 'Error', 'danger');
    }
  }

  private async promptAddMember(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Anadir miembro',
      message: 'Pega el UUID del usuario a anadir.',
      inputs: [{ name: 'uid', type: 'text', placeholder: 'user-id' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Anadir',
          handler: async (data: { uid: string }) => {
            try {
              await this.chat.addGroupMember(this.conversationId(), data.uid.trim());
              void this.showToast('Miembro anadido.');
            } catch (e) {
              void this.showToast(e instanceof Error ? e.message : 'Error', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private scrollToBottom(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' = 'success'
  ): Promise<void> {
    const t = await this.toastCtrl.create({
      message,
      duration: 2200,
      color,
      position: 'top'
    });
    await t.present();
  }
}
