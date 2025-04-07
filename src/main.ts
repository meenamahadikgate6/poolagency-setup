import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { LoginComponent } from './app/login/login.component';
import { createCustomElement } from '@angular/elements';

// bootstrapApplication(AppComponent, appConfig)
//   .catch((err) => console.error(err));

bootstrapApplication(AppComponent).then((ref) => {
  const injector = ref.injector;
  const loginModalElement = createCustomElement(LoginComponent, { injector });
  customElements.define('login-modal-element', loginModalElement);
});

