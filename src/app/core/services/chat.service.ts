import { Injectable, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';

import { ChatMessage, Conversation, ConversationParticipant } from '../../models';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

// ---------- Filas Supabase ----------
interface ConversationRow {
  id: string;
  type: 'private' | 'group';
  title: string | null;
  avatar: string | null;
  created_by: string | null;
  created_at: string;
  last_message_at: string;
}

type ProfileJoin = { name: string | null; avatar: string | null };

interface ParticipantRow {
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  // Supabase tipa los joins por FK como array.
  profiles?: ProfileJoin | ProfileJoin[] | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
  profiles?: ProfileJoin | ProfileJoin[] | null;
}

function firstProfile(p: ProfileJoin | ProfileJoin[] | null | undefined): ProfileJoin | null {
  if (!p) return null;
  return Array.isArray(p) ? (p[0] ?? null) : p;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  readonly conversations = signal<Conversation[]>([]);
  readonly loadingConversations = signal(false);
  readonly messagesByConversation = signal<Record<string, ChatMessage[]>>({});

  private conversationsChannel: RealtimeChannel | null = null;
  private messagesChannel: RealtimeChannel | null = null;
  private currentRoomChannel: RealtimeChannel | null = null;
  private initialized = false;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auth: AuthService
  ) {
    if (this.supabaseService.isConfigured) {
      void this.bootstrap();
    }
  }

  private async bootstrap(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    await this.auth.waitUntilReady();
    if (!this.auth.currentUser()) return;

    await this.loadConversations().catch((e) => console.error('conversations:', e));
    this.subscribeRealtime();
  }

  // -------------------------------------------------------------------
  // CONVERSATIONS
  // -------------------------------------------------------------------
  async loadConversations(): Promise<void> {
    const client = this.supabaseService.client;
    const me = this.auth.currentUser();
    if (!client || !me) return;

    this.loadingConversations.set(true);
    try {
      // 1. IDs de conversaciones donde participo
      const { data: myConvs, error: convErr } = await client
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', me.id);

      if (convErr) throw new Error(this.mapError(convErr.message));
      const convIds = ((myConvs as { conversation_id: string }[] | null) ?? []).map(
        (r) => r.conversation_id
      );
      if (convIds.length === 0) {
        this.conversations.set([]);
        return;
      }

      // 2. Datos de conversaciones
      const { data: convs, error: cErr } = await client
        .from('conversations')
        .select('id, type, title, avatar, created_by, created_at, last_message_at')
        .in('id', convIds)
        .order('last_message_at', { ascending: false });

      if (cErr) throw new Error(this.mapError(cErr.message));

      // 3. Participantes (con perfil) de esas conversaciones
      const { data: parts, error: pErr } = await client
        .from('conversation_participants')
        .select('conversation_id, user_id, role, joined_at, profiles(name, avatar)')
        .in('conversation_id', convIds);

      if (pErr) throw new Error(this.mapError(pErr.message));

      const participantsByConv = new Map<string, ConversationParticipant[]>();
      for (const row of (parts as unknown as ParticipantRow[] | null) ?? []) {
        const prof = firstProfile(row.profiles);
        const list = participantsByConv.get(row.conversation_id) ?? [];
        list.push({
          userId: row.user_id,
          name: prof?.name ?? 'Usuario',
          avatar: prof?.avatar || this.initials(prof?.name ?? 'Usuario'),
          role: row.role
        });
        participantsByConv.set(row.conversation_id, list);
      }

      const mapped: Conversation[] = ((convs as ConversationRow[] | null) ?? []).map((row) =>
        this.mapConversationRow(row, participantsByConv.get(row.id) ?? [], me.id)
      );
      this.conversations.set(mapped);
    } finally {
      this.loadingConversations.set(false);
    }
  }

  /** Crea (o devuelve la existente) conversación privada con otherUserId. */
  async getOrCreatePrivateConversation(otherUserId: string): Promise<string> {
    const client = this.supabaseService.assertConfigured();
    const { data, error } = await client.rpc('get_or_create_private_conversation', {
      other_user: otherUserId
    });
    if (error) throw new Error(this.mapError(error.message));
    await this.loadConversations();
    return data as string;
  }

  /** Crea un grupo con un titulo y miembros (sin incluir al usuario actual). */
  async createGroup(title: string, memberIds: string[], avatar = ''): Promise<string> {
    const client = this.supabaseService.assertConfigured();
    const { data, error } = await client.rpc('create_group_conversation', {
      p_title: title,
      p_avatar: avatar,
      member_ids: memberIds
    });
    if (error) throw new Error(this.mapError(error.message));
    await this.loadConversations();
    return data as string;
  }

  async addGroupMember(conversationId: string, userId: string): Promise<void> {
    const client = this.supabaseService.assertConfigured();
    const { error } = await client.rpc('add_group_member', {
      conv_id: conversationId,
      new_user: userId
    });
    if (error) throw new Error(this.mapError(error.message));
    await this.loadConversations();
  }

  async removeGroupMember(conversationId: string, userId: string): Promise<void> {
    const client = this.supabaseService.assertConfigured();
    const { error } = await client.rpc('remove_group_member', {
      conv_id: conversationId,
      target_user: userId
    });
    if (error) throw new Error(this.mapError(error.message));
    await this.loadConversations();
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations().find((c) => c.id === id);
  }

  // -------------------------------------------------------------------
  // MESSAGES
  // -------------------------------------------------------------------
  async loadMessages(conversationId: string): Promise<void> {
    const client = this.supabaseService.assertConfigured();
    const { data, error } = await client
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at, profiles(name, avatar)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) throw new Error(this.mapError(error.message));

    const mapped = ((data as unknown as MessageRow[] | null) ?? []).map((row) =>
      this.mapMessageRow(row)
    );
    this.messagesByConversation.update((items) => ({
      ...items,
      [conversationId]: mapped
    }));
  }

  messagesFor(conversationId: string): ChatMessage[] {
    return this.messagesByConversation()[conversationId] ?? [];
  }

  async sendMessage(conversationId: string, content: string): Promise<void> {
    const me = this.auth.currentUser();
    if (!me) throw new Error('No hay sesion activa.');
    const clean = content.trim();
    if (!clean) return;

    const client = this.supabaseService.assertConfigured();
    const { data, error } = await client
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: me.id,
        content: clean
      })
      .select('id, conversation_id, sender_id, content, created_at')
      .single<MessageRow>();

    if (error) throw new Error(this.mapError(error.message));

    // Optimista: ya llegará por realtime tambien (deduplicamos por id).
    const optimistic = this.mapMessageRow({
      ...data,
      profiles: { name: me.name, avatar: me.avatar }
    });
    this.appendMessage(optimistic);
  }

  // -------------------------------------------------------------------
  // REALTIME
  // -------------------------------------------------------------------
  private subscribeRealtime(): void {
    const client = this.supabaseService.client;
    if (!client) return;

    this.conversationsChannel?.unsubscribe();
    this.messagesChannel?.unsubscribe();

    this.conversationsChannel = client
      .channel('conversations_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_participants' },
        () => {
          void this.loadConversations();
        }
      )
      .subscribe();

    this.messagesChannel = client
      .channel('messages_global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newRow = payload.new as MessageRow;
          // Solo nos interesa si la conv ya está en mi lista
          const conv = this.getConversation(newRow.conversation_id);
          if (!conv) {
            void this.loadConversations();
            return;
          }
          // Buscar nombre del sender en participants
          const sender = conv.participants.find((p) => p.userId === newRow.sender_id);
          this.appendMessage(
            this.mapMessageRow({
              ...newRow,
              profiles: sender
                ? { name: sender.name, avatar: sender.avatar }
                : { name: 'Usuario', avatar: '' }
            })
          );
          // refrescar orden del side panel
          void this.loadConversations();
        }
      )
      .subscribe();
  }

  /** Suscripción específica a una conversación abierta (mensajes nuevos). */
  subscribeToConversation(conversationId: string): () => void {
    const client = this.supabaseService.client;
    if (!client) return () => undefined;

    this.currentRoomChannel?.unsubscribe();
    this.currentRoomChannel = client
      .channel(`conv_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const row = payload.new as MessageRow;
          const conv = this.getConversation(conversationId);
          const sender = conv?.participants.find((p) => p.userId === row.sender_id);
          this.appendMessage(
            this.mapMessageRow({
              ...row,
              profiles: sender
                ? { name: sender.name, avatar: sender.avatar }
                : { name: 'Usuario', avatar: '' }
            })
          );
        }
      )
      .subscribe();

    return () => {
      this.currentRoomChannel?.unsubscribe();
      this.currentRoomChannel = null;
    };
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private appendMessage(msg: ChatMessage): void {
    this.messagesByConversation.update((items) => {
      const existing = items[msg.conversationId] ?? [];
      if (existing.some((m) => m.id === msg.id)) {
        return items;
      }
      return {
        ...items,
        [msg.conversationId]: [...existing, msg].sort(
          (a, b) => a.createdAtTimestamp - b.createdAtTimestamp
        )
      };
    });
  }

  private mapConversationRow(
    row: ConversationRow,
    participants: ConversationParticipant[],
    myId: string
  ): Conversation {
    let title = row.title ?? '';
    let avatar = row.avatar ?? '';
    if (row.type === 'private') {
      const other = participants.find((p) => p.userId !== myId);
      title = other?.name ?? 'Chat privado';
      avatar = other?.avatar ?? this.initials(title);
    } else {
      title = title || 'Grupo';
      avatar = avatar || this.initials(title);
    }

    const lastTs = new Date(row.last_message_at).getTime();
    return {
      id: row.id,
      type: row.type,
      title,
      avatar,
      createdBy: row.created_by,
      createdAt: row.created_at,
      lastMessageAt: this.formatDate(row.last_message_at),
      lastMessageAtTimestamp: Number.isFinite(lastTs) ? lastTs : 0,
      participants
    };
  }

  private mapMessageRow(row: MessageRow): ChatMessage {
    const ts = new Date(row.created_at).getTime();
    const prof = firstProfile(row.profiles);
    const name = prof?.name ?? 'Usuario';
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      senderName: name,
      senderAvatar: prof?.avatar || this.initials(name),
      content: row.content,
      createdAt: this.formatTime(row.created_at),
      createdAtTimestamp: Number.isFinite(ts) ? ts : Date.now()
    };
  }

  private formatDate(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }

  private formatTime(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }

  private initials(name: string): string {
    return (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((it) => it[0]?.toUpperCase() ?? '')
      .join('');
  }

  private mapError(message: string): string {
    // Log SIEMPRE el error original para diagnostico: el mensaje en UI
    // queda traducido pero el detalle queda en la consola.
    console.error('[ChatService] supabase error:', message);

    const m = (message || '').toLowerCase();

    // Tabla inexistente: postgres devuelve textualmente
    //   relation "public.xxx" does not exist  (SQLSTATE 42P01)
    if (m.includes('does not exist') && m.includes('relation')) {
      return 'Las tablas de chat no existen. Ejecuta supabase/chat.sql y supabase/realtime.sql.';
    }

    // Funcion/RPC inexistente (SQLSTATE 42883)
    if (m.includes('does not exist') && m.includes('function')) {
      return 'Faltan funciones RPC de chat. Ejecuta supabase/chat.sql.';
    }
    // PostgREST devuelve PGRST202 cuando no encuentra la funcion RPC
    if (m.includes('pgrst202') || m.includes('could not find the function')) {
      return 'Faltan funciones RPC de chat. Ejecuta supabase/chat.sql.';
    }

    // RLS
    if (m.includes('row-level security') || m.includes('row level security')) {
      return 'La politica RLS de chat no permite esta operacion. Revisa supabase/chat.sql.';
    }

    // Permisos GRANT
    if (m.includes('permission denied')) {
      return 'Permisos insuficientes en la BBDD. Revisa los GRANT de supabase/chat.sql.';
    }

    // Recursion infinita en politicas (sintoma clasico cuando una policy
    // de conversation_participants se referencia a si misma).
    if (m.includes('infinite recursion')) {
      return 'Recursion infinita en politicas RLS. Revisa supabase/chat.sql (debe usar is_conversation_member SECURITY DEFINER).';
    }

    return message;
  }
}
