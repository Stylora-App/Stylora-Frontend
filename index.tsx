import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './src/app.routes';
import { credentialsInterceptor } from './src/interceptors/credentials.interceptor';
import { refreshInterceptor } from './src/interceptors/refresh.interceptor';
import { provideApiConfiguration } from './src/openapi_generated/api-configuration';
import { GOOGLE_CLIENT_ID } from './src/tokens';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([credentialsInterceptor, refreshInterceptor])),
    provideApiConfiguration(''),
    { provide: GOOGLE_CLIENT_ID, useValue: (window as any).__STYLORA_GOOGLE_CLIENT_ID__ ?? '' },
  ]
}).catch((err) => console.error(err));
