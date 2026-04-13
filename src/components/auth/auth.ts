import { Component, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WardrobeService } from '../../services/wardrobe.service';
import { ILoginRequest, IRegisterRequest } from '../../models';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class AuthComponent {
  private authService = inject(AuthService);
  private wardrobeService = inject(WardrobeService);
  private router = inject(Router);

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
    
    const request: ILoginRequest = {
      email: this.loginEmail,
      password: this.loginPassword,
      rememberMe: this.rememberMe
    };

    const response = await this.authService.login(request);

    this.isLoading.set(false);

    if (response.success) {
      if (this.authenticated.observed) {
        this.authenticated.emit();
      } else {
        this.wardrobeService.initializeData();
        this.router.navigate(['/dashboard']);
      }
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

    const request: IRegisterRequest = {
      email: this.registerEmail,
      password: this.registerPassword,
      firstName: this.firstName || undefined,
      lastName: this.lastName || undefined
    };

    const response = await this.authService.register(request);

    this.isLoading.set(false);

    if (response.success) {
      if (this.authenticated.observed) {
        this.authenticated.emit();
      } else {
        this.wardrobeService.initializeData();
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.errorMessage.set(response.message || 'Registration failed. Please try again.');
    }
  }
}
