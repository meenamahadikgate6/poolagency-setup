
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { createCustomElement } from '@angular/elements';
import { DashboardComponent } from './app/components/dashboard/dashboard.component';
import { UpgradeModule } from '@angular/upgrade/static';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(moduleRef => {
    const injector = moduleRef.injector;
    // moduleRef.injector.bootstrap(AppComponent);
    
    const upgrade = moduleRef.injector.get(UpgradeModule);
    upgrade.bootstrap(document.body, ['POOLAGENCY']);

    const el = createCustomElement(DashboardComponent, { injector });
    customElements.define('pb-dashboard', el);
    })
  .catch(err => console.error(err));

  