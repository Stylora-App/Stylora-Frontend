import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './src/app.routes';
import { credentialsInterceptor } from './src/interceptors/credentials.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([credentialsInterceptor])),
  ]
}).catch((err) => console.error(err));
