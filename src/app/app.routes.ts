import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full'
  },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing.page').then((m) => m.LandingPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register.page').then((m) => m.RegisterPage)
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home.page').then((m) => m.HomePage)
      },
      {
        path: 'review',
        loadComponent: () => import('./pages/review.page').then((m) => m.ReviewPage)
      },
      {
        path: 'social',
        loadComponent: () => import('./pages/social.page').then((m) => m.SocialPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile.page').then((m) => m.ProfilePage)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  }
];
