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
- [ ] Definir RLS (políticas row level security).
- [ ] Configurar variables `SUPABASE_URL`, `SUPABASE_KEY`.
- [x] Implementar `AuthService`, `SocialService`, `ChatService`, etc. (local state existente).

## 3. Módulo de autenticación
- [x] Implementar `login.page.ts` y `register.page.ts`.
- [x] `AuthService` con `login`, `register`, `logout`, `isLoggedIn` (local state).
- [x] Demo: `demo@gamestat.app` acceso solo con email.
- [x] Persistencia sesión con `localStorage`.
- [x] `auth.guard.ts` y rutas protegidas.

## 4. UI y navegación
- [] `landing.page.ts` con información y CTA.
- [] `tabs.page.ts` con rutas: `home`, `profile`, `review`, `social`.
- [] `home.page.ts` (panel con métricas y atajos).
- [] `profile.page.ts` (datos usuario, edición de perfil).
- [] `review.page.ts` (crear+listar reseñas; edición/elim pendiente en UI).
- [] `social.page.ts` (feed, posts, like).
Notas: Hay muchas que no funcionan, como la navegación entre páginas en algunos botones. Los estilos están fatal. Al meterse en la aplicación la página que tendría que salir primero es la landing page. Esa página habrá que hacerla bonita con imagenes de juegos en grid y con explicaciones de la aplicacion para atraer. 

Las páginas las organizaría como se hace en Instagram: Feed (donde salen todas las reviews), chat (estilo WhatsApp), Buscar (para busscar el juego que queramos y se vean todas sus reviews, valoraciones e información) y Perfil.

## 5. Chat personal y grupal
- [x] Modelos de sala y mensajes en `models.ts`.
- [x] `chat.service.ts` con envío de mensajes y rooms.
- [ ] UI chat con lista de salas + mensajes chateables (parcial / no hay SPA dedicada).
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
- [ ] Configurar `src/environments` con variables.
- [ ] `npm run build` / `ionic build`.
- [ ] Despliegue (Netlify/Vercel/Firebase/Supabase).
- [ ] CI/CD (GitHub Actions).

## 9. Documentación
- [x] Anteproyecto, arquitectura, diagramas (ya existe en README + doc). 
- [ ] Manual de usuario.
- [ ] Manual de despliegue.

## 10. Mejora posterior
- [ ] Integrar RAWG API.
- [ ] Push notifications.
- [ ] Recomendaciones y métricas.
- [ ] Internacionalización (i18n).