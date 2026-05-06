import { Component, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WardrobeService } from '../../services/wardrobe.service';
import { ILoginRequest, IRegisterRequest } from '../../models';
import {
  PASSWORD_POLICY_MESSAGE,
  hasMinPasswordLength,
  hasSpecialCharacter,
  hasUppercaseLetter,
  isPasswordPolicyValid
} from '../../utils/password-policy';

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
  showLoginPassword = signal(false);
  showRegisterPassword = signal(false);
  showConfirmPassword = signal(false);
  readonly passwordPolicyMessage = PASSWORD_POLICY_MESSAGE;

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

  setAuthMode(isLogin: boolean) {
    this.isLoginMode.set(isLogin);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.showLoginPassword.set(false);
    this.showRegisterPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  hasRegisterPasswordMinLength(): boolean {
    return hasMinPasswordLength(this.registerPassword);
  }

  hasRegisterPasswordUppercase(): boolean {
    return hasUppercaseLetter(this.registerPassword);
  }

  hasRegisterPasswordSpecialCharacter(): boolean {
    return hasSpecialCharacter(this.registerPassword);
  }

  isRegisterPasswordValid(): boolean {
    return isPasswordPolicyValid(this.registerPassword);
  }

  hasStartedRegisterPassword(): boolean {
    return this.registerPassword.length > 0;
  }

  hasStartedConfirmPassword(): boolean {
    return this.confirmPassword.length > 0;
  }

  doRegisterPasswordsMatch(): boolean {
    return this.registerPassword === this.confirmPassword;
  }

  isFieldInvalid(field: NgModel | null | undefined): boolean {
    return Boolean(field && field.touched && field.invalid);
  }

  isRegisterPasswordFieldInvalid(field: NgModel | null | undefined): boolean {
    return Boolean(field && field.touched && (!field.value || !this.isRegisterPasswordValid()));
  }

  isRegisterConfirmPasswordInvalid(field: NgModel | null | undefined): boolean {
    return Boolean(field && field.touched && (!field.value || !this.doRegisterPasswordsMatch()));
  }

  getRequiredFieldMessage(fieldName: string): string {
    return `${fieldName} is required.`;
  }

  getRegisterEmailError(field: NgModel | null | undefined): string {
    if (!field?.touched) {
      return '';
    }

    if (field.errors?.['required']) {
      return 'Email is required.';
    }

    if (field.errors?.['email']) {
      return 'Enter a valid email address.';
    }

    return '';
  }

  getRegisterPasswordError(field: NgModel | null | undefined): string {
    if (!field?.touched) {
      return '';
    }

    if (!field.value) {
      return 'Password is required.';
    }

    if (!this.isRegisterPasswordValid()) {
      return this.passwordPolicyMessage;
    }

    return '';
  }

  getConfirmPasswordError(field: NgModel | null | undefined): string {
    if (!field?.touched) {
      return '';
    }

    if (!field.value) {
      return 'Please confirm your password.';
    }

    if (!this.doRegisterPasswordsMatch()) {
      return 'Passwords do not match.';
    }

    return '';
  }

  async onLogin(form?: NgForm) {
    this.errorMessage.set('');
    this.successMessage.set('');
    
    if (!this.loginEmail || !this.loginPassword) {
      form?.control.markAllAsTouched();
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

  async onRegister(form?: NgForm) {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.firstName.trim() || !this.lastName.trim() || !this.registerEmail || !this.registerPassword) {
      form?.control.markAllAsTouched();
      this.errorMessage.set('Please complete all required fields.');
      return;
    }

    if (!this.isRegisterPasswordValid()) {
      form?.control.markAllAsTouched();
      this.errorMessage.set(this.passwordPolicyMessage);
      return;
    }

    if (this.registerPassword !== this.confirmPassword) {
      form?.control.markAllAsTouched();
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);

    const request: IRegisterRequest = {
      email: this.registerEmail,
      password: this.registerPassword,
      firstName: this.firstName.trim() || undefined,
      lastName: this.lastName.trim() || undefined
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
