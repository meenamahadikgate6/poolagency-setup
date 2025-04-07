import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'login', component: LoginComponent }, // optional
    { path: '**', redirectTo: 'dashboard' }, // wildcard fallback
  ];
