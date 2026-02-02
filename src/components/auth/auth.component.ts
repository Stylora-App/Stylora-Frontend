import { Component, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginRequest, RegisterRequest } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <h1 class="font-serif text-5xl font-bold tracking-tight text-gray-900">Stylora.</h1>
          <p class="mt-3 text-gray-500">Your AI-powered personal stylist</p>
        </div>

        <!-- Auth Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <!-- Tab Switcher -->
          <div class="flex mb-8 bg-gray-100 rounded-xl p-1">
            <button 
              (click)="isLoginMode.set(true)"
              [class]="isLoginMode() ? 'flex-1 py-2.5 rounded-lg text-sm font-medium bg-white shadow-sm text-gray-900' : 'flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700'">
              Sign In
            </button>
            <button 
              (click)="isLoginMode.set(false)"
              [class]="!isLoginMode() ? 'flex-1 py-2.5 rounded-lg text-sm font-medium bg-white shadow-sm text-gray-900' : 'flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700'">
              Create Account
            </button>
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- Success Message -->
          @if (successMessage()) {
            <div class="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-xl text-sm flex items-center gap-2">
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>{{ successMessage() }}</span>
            </div>
          }

          <!-- Login Form -->
          @if (isLoginMode()) {
            <form (ngSubmit)="onLogin()" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input 
                  type="email" 
                  [(ngModel)]="loginEmail" 
                  name="loginEmail"
                  required
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none transition"
                  placeholder="you@example.com">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input 
                  type="password" 
                  [(ngModel)]="loginPassword" 
                  name="loginPassword"
                  required
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none transition"
                  placeholder="••••••••">
              </div>
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="rememberMe" 
                    name="rememberMe"
                    class="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900">
                  <span class="text-sm text-gray-600">Remember me</span>
                </label>
              </div>
              <button 
                type="submit" 
                [disabled]="isLoading()"
                class="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                @if (isLoading()) {
                  <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                } @else {
                  <span>Sign In</span>
                }
              </button>
            </form>
          } @else {
            <!-- Register Form -->
            <form (ngSubmit)="onRegister()" class="space-y-5">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input 
                    type="text" 
                    [(ngModel)]="firstName" 
                    name="firstName"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none transition"
                    placeholder="John">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input 
                    type="text" 
                    [(ngModel)]="lastName" 
                    name="lastName"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none transition"
                    placeholder="Doe">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input 
                  type="email" 
                  [(ngModel)]="registerEmail" 
                  name="registerEmail"
                  required
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none transition"
                  placeholder="you@example.com">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input 
                  type="password" 
                  [(ngModel)]="registerPassword" 
                  name="registerPassword"
                  required
                  minlength="6"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none transition"
                  placeholder="Min. 6 characters">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input 
                  type="password" 
                  [(ngModel)]="confirmPassword" 
                  name="confirmPassword"
                  required
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none transition"
                  placeholder="••••••••">
              </div>
              <button 
                type="submit" 
                [disabled]="isLoading()"
                class="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                @if (isLoading()) {
                  <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating account...</span>
                } @else {
                  <span>Create Account</span>
                }
              </button>
            </form>
          }
        </div>

        <!-- Footer -->
        <p class="mt-8 text-center text-sm text-gray-400">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  `
})
export class AuthComponent {
  private authService = inject(AuthService);

  @Output() authenticated = new EventEmitter<void>();

  isLoginMode = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Login form
  loginEmail = '';
  loginPassword = '';
  rememberMe = false;

  // Register form
  firstName = '';
  lastName = '';
  registerEmail = '';
  registerPassword = '';
  confirmPassword = '';

  async onLogin() {
    this.errorMessage.set('');
    this.successMessage.set('');
    
    if (!this.loginEmail || !this.loginPassword) {
      this.errorMessage.set('Please enter your email and password.');
      return;
    }

    this.isLoading.set(true);
    
    const response = await this.authService.login({
      email: this.loginEmail,
      password: this.loginPassword,
      rememberMe: this.rememberMe
    });

    this.isLoading.set(false);

    if (response.success) {
      this.authenticated.emit();
    } else {
      this.errorMessage.set(response.message || 'Login failed. Please try again.');
    }
  }

  async onRegister() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.registerEmail || !this.registerPassword) {
      this.errorMessage.set('Please enter your email and password.');
      return;
    }

    if (this.registerPassword.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters long.');
      return;
    }

    if (this.registerPassword !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);

    const response = await this.authService.register({
      email: this.registerEmail,
      password: this.registerPassword,
      firstName: this.firstName || undefined,
      lastName: this.lastName || undefined
    });

    this.isLoading.set(false);

    if (response.success) {
      this.authenticated.emit();
    } else {
      this.errorMessage.set(response.message || 'Registration failed. Please try again.');
    }
  }
}
