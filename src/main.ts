import { importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideRouter(appRoutes, withComponentInputBinding()),
    importProvidersFrom(IonicModule.forRoot())
  ]
}).catch((error) => console.error(error));
