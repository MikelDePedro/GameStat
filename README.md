# GameStat

Starter base para una app `Ionic + Angular` con:

- Login y registro
- Landing page
- Tabs de `Home`, `Perfil`, `Review` y `Social`
- Chat personal y grupal entre usuarios

## Estado actual

La estructura y el codigo de la app ya esta creada, pero en este entorno no hay `node`, `npm` ni `ionic`, por lo que no se pudo instalar dependencias ni ejecutar la app.

## Flujo de acceso

- El login entra con correo y contraseña.
- El registro pide nick, correo, contraseña y juego favorito.
- La landing y el home ya explican mejor el uso de la app: guardar, valorar y compartir juegos.

## APK en Android

El proyecto ya esta preparado con Capacitor, pero para compilar el APK necesitas:

1. Node.js + dependencias instaladas con `npm install`.
2. Un JDK 11 o superior.
3. Android Studio o las Android SDK Build Tools.
4. Ejecutar `npm run build`.
5. Ejecutar `npx cap sync android`.
6. Compilar el debug APK con `cd android && .\\gradlew.bat assembleDebug`.

En este entorno la sincronizacion de Capacitor funciona, pero la compilacion del APK se bloquea porque solo hay Java 8 instalado.

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
