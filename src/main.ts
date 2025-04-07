
// main.ts
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { appConfig } from './app.config';
import { LoginComponent } from './app/components/login/login.component';
import { AppComponent } from './app/app.component';

createApplication({
  ...appConfig,
  providers: [importProvidersFrom(HttpClientModule)],
})
  .then((app) => {
    // Check for app-root in DOM
    if (document.querySelector('app-root')) {
      // ✅ Full Angular App
      app.bootstrap(AppComponent);
    } else {
      // ✅ Angular Element Only
      const LikeButton = createCustomElement(LoginComponent, { injector: app.injector });
      customElements.define('like-button', LikeButton);
    }
  })
  .catch((err) => console.error('Error initializing Angular:', err));
