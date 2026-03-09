import { Injectable, computed, signal } from '@angular/core';

import { UserProfile } from '../../models';

interface StoredAuthState {
  users: UserProfile[];
  currentUser: UserProfile | null;
}

const STORAGE_KEY = 'gamestat-auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly state = signal<StoredAuthState>(this.loadState());

  readonly currentUser = computed(() => this.state().currentUser);
  readonly isAuthenticated = computed(() => Boolean(this.state().currentUser));

  login(email: string): boolean {
    const user = this.state().users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return false;
    }

    this.patchState({ currentUser: user });
    return true;
  }

  register(payload: Omit<UserProfile, 'id'>): void {
    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      ...payload
    };

    const users = [...this.state().users, newUser];
    this.patchState({ users, currentUser: newUser });
  }

  updateProfile(patch: Partial<UserProfile>): void {
    const currentUser = this.state().currentUser;
    if (!currentUser) {
      return;
    }

    const updated = { ...currentUser, ...patch };
    const users = this.state().users.map((user) => (user.id === updated.id ? updated : user));
    this.patchState({ currentUser: updated, users });
  }

  logout(): void {
    this.patchState({ currentUser: null });
  }

  private patchState(patch: Partial<StoredAuthState>): void {
    const nextState = { ...this.state(), ...patch };
    this.state.set(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }

  private loadState(): StoredAuthState {
    const fallbackUser: UserProfile = {
      id: 'demo-user',
      name: 'Iker Demo',
      email: 'demo@gamestat.app',
      favoriteGame: 'EA FC 26',
      bio: 'Jugador competitivo y creador de resenas.',
      avatar: 'ID'
    };

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { users: [fallbackUser], currentUser: null };
    }

    try {
      return JSON.parse(raw) as StoredAuthState;
    } catch {
      return { users: [fallbackUser], currentUser: null };
    }
  }
}
