import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonAvatar,
  IonBadge,
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  chatbubbleEllipsesOutline,
  peopleCircleOutline,
  personAddOutline,
  searchOutline
} from 'ionicons/icons';

import { Conversation, UserProfile } from '../../models';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { ProfileService } from '../../core/services/profile.service';

type Tab = 'private' | 'group';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonAvatar,
    IonBadge,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonText
  ],
  styleUrls: ['./social.page.scss'],
  template: `
    <ion-content>
      <div class="page-shell page social-shell">

        <section class="surface-card hub-card">
          <header class="hub-header">
            <div>
              <p class="eyebrow">Mensajes</p>
              <h1>Chats</h1>
            </div>
            <ion-button color="primary" (click)="openNewGroup()">
              <ion-icon slot="start" name="add-circle-outline"></ion-icon>
              Nuevo grupo
            </ion-button>
          </header>

          <ion-segment [value]="activeTab()" (ionChange)="setTab($any($event.detail.value))">
            <ion-segment-button value="private">
              <ion-icon name="chatbubble-ellipses-outline"></ion-icon>
              <ion-label>Privados</ion-label>
            </ion-segment-button>
            <ion-segment-button value="group">
              <ion-icon name="people-circle-outline"></ion-icon>
              <ion-label>Grupos</ion-label>
            </ion-segment-button>
          </ion-segment>

          <div class="loading" *ngIf="chat.loadingConversations()">
            <ion-spinner name="crescent"></ion-spinner>
          </div>

          <ion-text color="medium" *ngIf="!chat.loadingConversations() && filteredConversations().length === 0">
            <p class="empty">No tienes {{ activeTab() === 'private' ? 'chats privados' : 'grupos' }} todavia.</p>
          </ion-text>

          <ion-list class="conversation-list" lines="none">
            <ion-item
              *ngFor="let conv of filteredConversations(); trackBy: trackByConv"
              button
              [routerLink]="['/tabs/social/chat', conv.id]">
              <ion-avatar slot="start" class="avatar-circle">
                <span>{{ conv.avatar || initials(conv.title) }}</span>
              </ion-avatar>
              <ion-label>
                <h2>{{ conv.title }}</h2>
                <p>{{ conv.type === 'group' ? conv.participants.length + ' miembros' : 'Chat privado' }}</p>
              </ion-label>
              <ion-badge slot="end" color="medium">{{ conv.lastMessageAt }}</ion-badge>
            </ion-item>
          </ion-list>
        </section>

        <section class="surface-card people-card">
          <header class="hub-header">
            <div>
              <p class="eyebrow">Comunidad</p>
              <h2>Inicia un chat privado</h2>
            </div>
          </header>

          <ion-item lines="none" class="search-item">
            <ion-icon slot="start" name="search-outline"></ion-icon>
            <ion-input
              placeholder="Buscar usuarios..."
              [(ngModel)]="searchTerm"
              (ionInput)="onSearch()"></ion-input>
          </ion-item>

          <div class="loading" *ngIf="loadingUsers()">
            <ion-spinner name="crescent"></ion-spinner>
          </div>

          <ion-list lines="none" class="users-list" *ngIf="!loadingUsers()">
            <ion-item *ngFor="let u of users(); trackBy: trackByUser" button (click)="startPrivate(u)">
              <ion-avatar slot="start" class="avatar-circle">
                <span>{{ u.avatar }}</span>
              </ion-avatar>
              <ion-label>
                <h3>{{ u.name }}</h3>
                <p>{{ u.favoriteGame || 'Sin juego favorito' }}</p>
              </ion-label>
              <ion-button slot="end" fill="clear">
                <ion-icon slot="icon-only" name="person-add-outline"></ion-icon>
              </ion-button>
            </ion-item>
          </ion-list>
        </section>
      </div>
    </ion-content>
  `
})
export class SocialPage implements OnInit {
  readonly activeTab = signal<Tab>('private');
  readonly users = signal<UserProfile[]>([]);
  readonly loadingUsers = signal(false);
  searchTerm = '';
  private searchHandle: ReturnType<typeof setTimeout> | null = null;

  readonly filteredConversations = computed<Conversation[]>(() =>
    this.chat.conversations().filter((c) => c.type === this.activeTab())
  );

  constructor(
    public readonly chat: ChatService,
    private readonly auth: AuthService,
    private readonly profiles: ProfileService,
    private readonly router: Router,
    private readonly toastCtrl: ToastController,
    private readonly alertCtrl: AlertController
  ) {
    addIcons({
      addCircleOutline,
      chatbubbleEllipsesOutline,
      peopleCircleOutline,
      personAddOutline,
      searchOutline
    });
  }

  async ngOnInit(): Promise<void> {
    await this.chat.loadConversations().catch(() => undefined);
    void this.loadUsers();
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  trackByConv(_: number, conv: Conversation): string {
    return conv.id;
  }

  trackByUser(_: number, u: UserProfile): string {
    return u.id;
  }

  initials(name: string): string {
    return (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((it) => it[0]?.toUpperCase() ?? '')
      .join('');
  }

  onSearch(): void {
    if (this.searchHandle) clearTimeout(this.searchHandle);
    this.searchHandle = setTimeout(() => void this.loadUsers(), 250);
  }

  private async loadUsers(): Promise<void> {
    const me = this.auth.currentUser();
    if (!me) return;
    this.loadingUsers.set(true);
    try {
      const items = await this.profiles.search(this.searchTerm);
      this.users.set(items.filter((u) => u.id !== me.id));
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingUsers.set(false);
    }
  }

  async startPrivate(user: UserProfile): Promise<void> {
    try {
      const convId = await this.chat.getOrCreatePrivateConversation(user.id);
      await this.router.navigate(['/tabs/social/chat', convId]);
    } catch (e) {
      void this.showToast(this.errorMessage(e), 'danger');
    }
  }

  async openNewGroup(): Promise<void> {
    const me = this.auth.currentUser();
    if (!me) return;

    let candidates: UserProfile[] = [];
    try {
      candidates = (await this.profiles.listAll()).filter((u) => u.id !== me.id);
    } catch (e) {
      void this.showToast(this.errorMessage(e), 'danger');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Nuevo grupo',
      inputs: [
        { name: 'title', type: 'text', placeholder: 'Nombre del grupo' },
        ...candidates.map((u) => ({
          name: u.id,
          type: 'checkbox' as const,
          label: `${u.name}${u.favoriteGame ? ' · ' + u.favoriteGame : ''}`,
          value: u.id
        }))
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: async (raw: unknown) => {
            // Ionic devuelve { title: '...' } o un array de IDs marcados.
            let title = '';
            let memberIds: string[] = [];
            if (Array.isArray(raw)) {
              memberIds = raw as string[];
            } else if (raw && typeof raw === 'object') {
              const obj = raw as Record<string, unknown>;
              title = (obj['title'] ?? '').toString().trim();
              memberIds = Object.keys(obj).filter(
                (k) => k !== 'title' && Boolean(obj[k])
              );
            }
            if (!title) {
              void this.showToast('El nombre del grupo es obligatorio.', 'warning');
              return false;
            }
            try {
              const convId = await this.chat.createGroup(title, memberIds);
              await this.router.navigate(['/tabs/social/chat', convId]);
              return true;
            } catch (e) {
              void this.showToast(this.errorMessage(e), 'danger');
              return false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success'
  ): Promise<void> {
    const t = await this.toastCtrl.create({
      message,
      duration: 2200,
      color,
      position: 'top'
    });
    await t.present();
  }

  private errorMessage(e: unknown): string {
    return e instanceof Error ? e.message : 'Error inesperado';
  }
}
