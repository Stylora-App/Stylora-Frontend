import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './src/app.routes';
import { credentialsInterceptor } from './src/interceptors/credentials.interceptor';
import { provideApiConfiguration } from './src/openapi_generated/api-configuration';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([credentialsInterceptor])),
    provideApiConfiguration('/api'),
  ]
}).catch((err) => console.error(err));
