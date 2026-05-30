import { Component, signal, inject, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthFormsComponent } from '../auth-forms/auth-forms';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, AuthFormsComponent],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class AuthComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  @Output() authenticated = new EventEmitter<void>();

  entered = signal(false);
  pulse = signal(false);

  readonly heroPaletteColors = ['#7a3a2f', '#a86438', '#cf9b5e', '#d9b483', '#6b7d7a', '#3e4a4a'];

  private enterTimer?: ReturnType<typeof setTimeout>;
  private pulseTimer?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.enterTimer = setTimeout(() => this.entered.set(true), 80);
    this.pulseTimer = setInterval(() => this.pulse.update(v => !v), 2200);
  }

  ngOnDestroy() {
    clearTimeout(this.enterTimer);
    clearInterval(this.pulseTimer);
  }

  onAuthenticated() {
    if (this.authenticated.observed) {
      this.authenticated.emit();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
