# GameStat

Starter base para una app `Ionic + Angular` con:

- Login y registro
- Landing page
- Tabs de `Home`, `Perfil`, `Review` y `Social`
- Chat personal y grupal entre usuarios

## Estado actual

La estructura y el codigo de la app ya esta creada, pero en este entorno no hay `node`, `npm` ni `ionic`, por lo que no se pudo instalar dependencias ni ejecutar la app.

## Pasos para arrancar en tu PC

1. Instala Node.js LTS.
2. En esta carpeta, ejecuta `npm install`.
3. Si quieres el CLI de Ionic: `npm install -g @ionic/cli`
4. Arranca el proyecto con `npm start` o `ionic serve`.

## Demo incluida

- Usuario demo: `demo@gamestat.app`
- El login demo entra solo con el email.
- Los datos de autenticacion se guardan en `localStorage`.

## Siguiente paso recomendado

Conectar `AuthService`, `SocialService` y `ChatService` a Firebase o Supabase para tener backend real, persistencia y chat en tiempo real.
