import { createCustomElement } from '@angular/elements';

 import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { UpgradeModule } from '@angular/upgrade/static';
import { DashboardComponent } from './app/shared/components/dashboard/dashboard.component';



  platformBrowserDynamic().bootstrapModule(AppModule)
    .then(platformRef => {
      const injector = platformRef.injector;
      const upgrade = injector.get(UpgradeModule) as UpgradeModule;
      const el = createCustomElement(DashboardComponent, { injector });
      customElements.define('pb-dashboard', el);
      upgrade.bootstrap(document.body, ['POOLAGENCY']);
    });

