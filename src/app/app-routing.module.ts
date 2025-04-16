import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AngularJSRouteGuard } from './shared/AngularJSRouteGuard';
import { HandlerComponent } from './handler/handler.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';


export const routes: Routes = [
  { path: '', redirectTo: '/app/dashboard', pathMatch: 'full' }, // default page as old app
  // {
  //   path: '',    
  //   loadChildren: () => import('./features/features-routing.module').then( m => m.FeaturesRoutingModule)
  // },
  {
    path: 'test',
    component: DashboardComponent,
  },
  {
    path: '**',
    canActivate: [AngularJSRouteGuard],
    component: HandlerComponent,
  },
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
