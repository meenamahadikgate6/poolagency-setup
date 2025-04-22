import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AngularJSRouteGuard } from './shared/AngularJSRouteGuard';
import { HandlerComponent } from './handler/handler.component';


export const routes: Routes = [
  { path: '', redirectTo: '/app/dashboard', pathMatch: 'full' }, // default page as old app
 
  {
    path: 'test',
    loadComponent: () => import('./shared/components/dashboard/dashboard.component').then( m => m.DashboardComponent)
  },
  {
    path: 'status',
    loadComponent: () => import('./shared/components/qb-status/qb-status.component').then( m => m.QbStatusComponent)
  },
  {
    path: '**',
    // canActivate: [AngularJSRouteGuard],
    component: HandlerComponent,
  },
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
