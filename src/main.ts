import { createCustomElement } from '@angular/elements';

 import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { UpgradeModule } from '@angular/upgrade/static';
import { DashboardComponent } from './app/shared/components/dashboard/dashboard.component';
import { QbStatusComponent } from './app/shared/components/qb-status/qb-status.component';
import { SocketService } from './app/shared/services/socket.service';

(async () => {  platformBrowserDynamic().bootstrapModule(AppModule)
    .then(platformRef => {
      const injector = platformRef.injector;
      const socketServiceInstance = injector.get(SocketService);

      // ✅ Start WebSocket connection first
      socketServiceInstance.initializeSocket();

      // ✅ Delay AngularJS execution until WebSocket is ready
      socketServiceInstance.getSocketInstance().on("connect", () => {
        console.log("✅ WebSocket connected! Now setting instance.");
        window.socketServiceInstance = socketServiceInstance;
      });

      const upgrade = injector.get(UpgradeModule) as UpgradeModule;

      const dashboardElement = createCustomElement(DashboardComponent, { injector });
      customElements.define('pb-dashboard', dashboardElement);

      const qbStatusElement = createCustomElement(QbStatusComponent, { injector });
      customElements.define('app-qb-status', qbStatusElement);

      upgrade.bootstrap(document.body, ['POOLAGENCY']);
    })
    .catch(err => console.error("❌ Angular Bootstrap Failed:", err));
})();




