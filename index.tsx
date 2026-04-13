
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './src/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
  ]
}).catch((err) => console.error(err));

