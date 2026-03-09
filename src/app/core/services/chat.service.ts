import { Injectable, signal } from '@angular/core';

import { ChatMessage, ChatRoom } from '../../models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  readonly rooms = signal<ChatRoom[]>([
    {
      id: 'dm-1',
      title: 'Chat con Marta',
      type: 'personal',
      members: ['Iker Demo', 'Marta']
    },
    {
      id: 'grp-1',
      title: 'Equipo Ranked',
      type: 'group',
      members: ['Iker Demo', 'Marta', 'Claudia', 'Raul']
    }
  ]);

  readonly messages = signal<ChatMessage[]>([
    {
      id: 'msg-1',
      roomId: 'dm-1',
      sender: 'Marta',
      content: 'Entramos a jugar a las 21:00?',
      createdAt: '20:12'
    },
    {
      id: 'msg-2',
      roomId: 'grp-1',
      sender: 'Raul',
      content: 'Subid builds para revisar antes del torneo.',
      createdAt: '18:40'
    },
    {
      id: 'msg-3',
      roomId: 'grp-1',
      sender: 'Claudia',
      content: 'Yo llevo el draft y el scouting.',
      createdAt: '18:43'
    }
  ]);

  sendMessage(roomId: string, sender: string, content: string): void {
    const clean = content.trim();
    if (!clean) {
      return;
    }

    this.messages.update((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        roomId,
        sender,
        content: clean,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }
}
