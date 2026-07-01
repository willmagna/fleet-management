import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'vehicles', pathMatch: 'full' },
      {
        path: 'vehicles',
        loadComponent: () =>
          import('./features/vehicles/vehicle-list/vehicle-list.component').then(
            (m) => m.VehicleListComponent,
          ),
      },
      {
        path: 'vehicles/kanban',
        loadComponent: () =>
          import('./features/vehicles/vehicle-kanban/vehicle-kanban.component').then(
            (m) => m.VehicleKanbanComponent,
          ),
      },
      {
        path: 'vehicles/new',
        loadComponent: () =>
          import('./features/vehicles/vehicle-form/vehicle-form.component').then(
            (m) => m.VehicleFormComponent,
          ),
      },
      {
        path: 'vehicles/:id/edit',
        loadComponent: () =>
          import('./features/vehicles/vehicle-form/vehicle-form.component').then(
            (m) => m.VehicleFormComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
