import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AngularJSRouteGuard } from './shared/AngularJSRouteGuard';
import { HandlerComponent } from './handler/handler.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';


export const routes: Routes = [
  { path: '', redirectTo: '/app/dashboard', pathMatch: 'full' }, // default page as old app
 
  {
    path: 'test',
    loadComponent: () => import('./components/dashboard/dashboard.component').then( m => m.DashboardComponent)
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
