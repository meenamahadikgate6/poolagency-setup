import { NgModule, ApplicationRef, DoBootstrap } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';import { RouterModule } from '@angular/router';

import '../scripts/app.js'; // 👈
import { AppComponent } from './app.component';
import { AppRoutingModule, routes } from './app-routing.module';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';

// @NgModule({
//   imports: [
//     BrowserModule,
//     AppComponent,
//     RouterModule.forRoot(routes)
//   ],
// })
// export class AppModule implements DoBootstrap {
//   constructor() {}

//   ngDoBootstrap(appRef: ApplicationRef): void {
//     // Angular bootstrap
   
//     // AngularJS bootstrap only if URL is /legacy
//     // this.upgrade.bootstrap(document.body, ['POOLAGENCY']);
//     // this.upgrade.bootstrap(document.body, ['legacyApp'], { strictDi: true });
//   }
// }


// import { NgModule, isDevMode } from '@angular/core';
// import { BrowserModule } from '@angular/platform-browser';
// import { UpgradeModule } from '@angular/upgrade/static'
// import { AppRoutingModule } from './app-routing.module';
// import { AppComponent } from './app.component';
// import { LocationStrategy, PathLocationStrategy } from '@angular/common';
// // import { ServiceWorkerModule } from '@angular/service-worker';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    UpgradeModule, // Included to support angularJs and angular latest
    AppRoutingModule, 
  ],
  providers: [{ provide: LocationStrategy, useClass: PathLocationStrategy }],
  bootstrap: [AppComponent]
})
export class AppModule {
  
  // constructor(private upgrade: UpgradeModule) {
  //   this.upgrade.bootstrap(document.body, ['POOLAGENCY'], { strictDi: true });
  // }
}



