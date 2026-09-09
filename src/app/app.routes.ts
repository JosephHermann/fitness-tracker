import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'hoy',
  },
  {
    path: 'hoy',
    loadComponent: () =>
      import('./features/today/today.component').then((m) => m.TodayComponent),
    title: 'Hoy // APEX Recomp',
  },
  {
    path: 'rutina',
    loadComponent: () =>
      import('./features/routine/routine.component').then((m) => m.RoutineComponent),
    title: 'Rutina PPL x2 // APEX Recomp',
  },
  {
    path: 'nutricion',
    loadComponent: () =>
      import('./features/nutrition/nutrition.component').then((m) => m.NutritionComponent),
    title: 'Nutrición & Macros // APEX Recomp',
  },
  {
    path: 'progreso',
    loadComponent: () =>
      import('./features/progress/progress.component').then((m) => m.ProgressComponent),
    title: 'Progreso & Fotos // APEX Recomp',
  },
  {
    path: 'roadmap',
    loadComponent: () =>
      import('./features/roadmap/roadmap.component').then((m) => m.RoadmapComponent),
    title: 'Roadmap Dic 2026 // APEX Recomp',
  },
  {
    path: '**',
    redirectTo: 'hoy',
  },
];
