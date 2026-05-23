# TODO GameStat (Ionic + Angular + Supabase)

## 1. Inicio y configuración local
- [x] `npm install`
- [x] `ionic serve` / `npm start`
- [x] `.gitignore`
- [x] `README.md`

## 2. Arquitectura backend
- [x] Diseñar ERD completo (profiles, follows, social_posts/likes/comments, conversations, conversation_participants, messages, game_reviews, rawg_games, favorite_games)
- [x] Crear tablas faltantes (ver `supabase/`)
- [x] RLS activado y políticas por tabla
- [x] RPCs para chat (`get_or_create_private_conversation`, `create_group_conversation`, `add_group_member`, `remove_group_member`)
- [x] Variables entorno (`supabase.url`, `supabase.anonKey`)
- [x] Servicios Angular (`AuthService`, `SocialService`, `ChatService`, `FollowService`, `ProfileService`, `GamesService`)

## 3. Auth
- [x] Login / Register / Logout
- [x] Persistencia con sesión Supabase
- [x] `auth.guard.ts`

## 4. UI
- [x] Landing, Tabs, Home
- [x] Profile propio + perfil de otros (`/profile/:userId`)
- [x] Reviews
- [x] Social hub (chats privados + grupos)
- [x] Chat detail con realtime
- [x] Feed social conectado a Supabase
- [x] Users (búsqueda + follow + abrir chat)

## 5. Chat
- [x] Modelos (`Conversation`, `ConversationParticipant`, `ChatMessage`)
- [x] Servicio chat conectado a Supabase
- [x] UI: lista de conversaciones + detalle
- [x] Persistencia real
- [x] Realtime (postgres_changes en `messages`, `conversation_participants`)
- [x] Crear grupo (RPC `create_group_conversation`)
- [x] Iniciar chat privado sin duplicados (RPC `get_or_create_private_conversation`)
- [x] Salir / añadir miembros en grupo

## 6. Social
- [x] Follow / unfollow + contadores
- [x] Ver perfiles ajenos
- [x] Feed real con posts, likes y comentarios (CRUD + realtime)

## 7. Testing
- [ ] Unit tests de servicios (TODO: añadir tests para `SocialService`, `ChatService`, `FollowService`)
- [ ] E2E (TODO: Cypress)

## 8. Deploy
- [x] Build (`npm run build`)
- [ ] Despliegue (Netlify / Vercel)
- [ ] CI/CD (GitHub Actions)

## 9. Docs
- [x] `supabase/README.md` (orden de migraciones)
- [ ] Manual de usuario
- [ ] Manual de despliegue

## 10. Mejoras posteriores
- [x] RAWG API
- [ ] Push notifications
- [ ] Métricas / dashboard
- [ ] i18n

---

## Bugs resueltos
1. ~~No funciona crear una review.~~ → ejecuta `supabase/game_reviews.sql`.
2. ~~No funciona crear opinión de un juego.~~ → mismo script.
3. ~~Los posts solo se guardan en sesión.~~ → ahora se persisten en `social_posts` con realtime.

## Acción manual requerida en Supabase
Ejecutar en este orden desde el SQL editor:
1. `supabase/profiles.sql`
2. `supabase/rawg_games.sql`
3. `supabase/game_reviews.sql`
4. `supabase/follows.sql`
5. `supabase/social_posts.sql`
6. `supabase/chat.sql`
7. `supabase/realtime.sql`
8. (Opcional) crear usuarios demo en Auth y luego `supabase/seed_demo.sql` con los UUID reales.
