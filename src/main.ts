import { createCustomElement } from '@angular/elements';
 import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { UpgradeModule } from '@angular/upgrade/static';
import { DashboardComponent } from './app/components/dashboard/dashboard.component';


platformBrowserDynamic().bootstrapModule(AppModule)
.then(platformRef => {
  const injector = platformRef.injector;
  const upgrade = platformRef.injector.get(UpgradeModule) as UpgradeModule;
  // , { strictDi: true }
  
  upgrade.bootstrap(document.body, ['POOLAGENCY']);
  const el = createCustomElement(DashboardComponent, { injector });
    customElements.define('pb-dashboard', el);
})
.catch(err => console.error(err));
