
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app';
import { provideZonelessChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection()
  ]
}).catch((err) => console.error(err));

