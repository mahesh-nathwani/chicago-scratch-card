import { Routes } from '@angular/router';
import { authGuard } from '@lib/guards';

export const routes: Routes = [
    {
        path: 'auth',
        loadChildren: async () => (await import('@pages/auth')).routes,
        canMatch: [authGuard({ requiresAuthentication: false })],
    },
    {
        path: '',
        loadChildren: async () => (await import('@pages/home')).routes,
        canMatch: [authGuard({requiresAuthentication: false})],
    },
    {
        path: 'users/:username',
        loadChildren: async () => (await import('@pages/user')).routes,
        canMatch: [authGuard()],
    },
    {
        path: 'cashback',
        loadChildren: async () => (await import('@pages/settings')).routes,
        canMatch: [authGuard({requiresAuthentication: false})],
    },
    {
        path: '**',
        loadComponent: async () => (await import('@pages/screens/not-found/not-found.component')).NotFoundComponent,
    },
];
