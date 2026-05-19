# TODO GameStat (Ionic + Angular)

## 1. Inicio y configuración local
- [x] Ejecutar:
  - `npm install`
  - opcional: `npm install -g @ionic/cli`
- [ ] Verificar ejecución local:
  - `npm start` o `ionic serve`
- [x] Añadir `.gitignore` si falta (node_modules, env, etc.).
- [x] Crear `README.md` instrucciones de arranque + demo user.

## 2. Arquitectura de datos y backend (Supabase recomendado)
- [ ] Diseñar ERD con tablas: `users`, `profiles`, `games`, `game_status`, `reviews`, `followers`, `chat_rooms`, `chat_messages`, `chat_participants`.
- [ ] Crear DB en Supabase / Postgres con claves, FK e índices.
- [x] Definir RLS (políticas row level security).
- [x] Configurar variables `SUPABASE_URL`, `SUPABASE_KEY`.
- [x] Implementar `AuthService`, `SocialService`, `ChatService`, etc. (local state existente).

## 3. Módulo de autenticación
- [x] Implementar `login.page.ts` y `register.page.ts`.
- [x] `AuthService` con `login`, `register`, `logout`, `isLoggedIn` (local state).
- [x] Demo: `demo@gamestat.app` acceso solo con email.
- [x] Persistencia sesión con `localStorage`.
- [x] `auth.guard.ts` y rutas protegidas.

## 4. UI y navegación
- [x] `landing.page.ts` con información y CTA.
- [x] `tabs.page.ts` con rutas: `home`, `profile`, `review`, `social`.
- [x] `home.page.ts` (panel con métricas y atajos).
- [x] `profile.page.ts` (datos usuario, edición de perfil).
- [x] `review.page.ts` (crear+listar reseñas; edición/elim pendiente en UI).
- [x] `social.page.ts` (feed, posts, like).

## 5. Chat personal y grupal
- [x] Modelos de sala y mensajes en `models.ts`.
- [x] `chat.service.ts` con envío de mensajes y rooms.
- [x] UI chat con lista de salas + mensajes chateables (integrado en `social.page.ts`).
- [ ] Historial persistente (actualmente en memoria, local state)

## 6. Funcionalidades sociales
- [ ] Seguir/dejar de seguir (no existe aún en servicio).
- [x] Actividad reciente (feed en `social.service` posts/reviews).
- [ ] Ver perfil de otros (pendiente).

## 7. Pruebas y QA
- [ ] Tests unitarios para servicios (no hay actualmente).
- [ ] Pruebas e2e (Cypress en caso necesario).
- [x] Validar guard, manejo de errores básicos en login/registro.

## 8. Infra y despliegue
- [x] Configurar `src/environments` con variables.
- [x] `npm run build` / `ionic build`.
- [ ] Despliegue (Netlify/Vercel/Firebase/Supabase).
- [ ] CI/CD (GitHub Actions).

## 9. Documentación
- [x] Anteproyecto, arquitectura, diagramas (ya existe en README + doc). 
- [ ] Manual de usuario.
- [ ] Manual de despliegue.

## 10. Mejora posterior
- [x] Integrar RAWG API.
- [ ] Push notifications.
- [ ] Recomendaciones y métricas.
- [ ] Internacionalización (i18n).


Cosas a arreglar:
1. No funciona crear una review. 
2. No funciona crear opinion de un juego.
---------- ERROR EN LAS 2 DE ARRIBA -> La tabla public.game_reviews no existe. Ejecuta supabase/game_reviews.sql.
3. El post del feed social solo se esta guardando en la sesion. Si cierro sesion y vuelvo a meterme no aparece.

Cosas a mejorar:
1. En Social lo que haria es un tab con una lista de chats dependiendo de los amigos que tengas y otro tab para grupos de amigos. Se tiene que poder crear grupo. Para esto hay que crear una tabla "Conversacion" en la que tienen que haber 2 usuarios. Tiene que haber otra tabla "Mensajes" que ira como clave foranea en la tabla "Conversacion". PEDIRSELO A LA IA
PEDRILE A LA IA LO MISMO PERO PARA CHATS GRUPALES, IGUAL ES MEJOR JUNTAR TODO EN UNA TABLA O HACER OTRA QUE SE LLAME "Conversaciones_grupales".

Cuando se clique en un chat, se abrirá la pestaña del chat. Se tienen que pasar como parametros el id de la conversación para saber que conversacion mostrar. Despues diseñar toda la pagina y hacer que funcione.

2. Valbu crea mas usuarios en supabase para poder postear cosas desde todos y ver si funciona bien.


3. es una prueba para ver si funciona