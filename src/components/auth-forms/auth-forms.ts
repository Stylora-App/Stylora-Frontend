import {
  Component, signal, inject, Input, Output, EventEmitter,
  AfterViewInit, OnDestroy, ElementRef, ViewChild, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WardrobeService } from '../../services/wardrobe.service';
import { GOOGLE_CLIENT_ID } from '../../tokens';
import type { LoginRequest } from '@/openapi_generated/models/login-request';
import type { RegisterRequest } from '@/openapi_generated/models/register-request';
import {
  PASSWORD_POLICY_MESSAGE,
  hasMinPasswordLength,
  hasSpecialCharacter,
  hasUppercaseLetter,
  isPasswordPolicyValid
} from '../../utils/password-policy';

declare const google: {
  accounts: {
    id: {
      initialize(config: { client_id: string; callback: (r: { credential: string }) => void; auto_select?: boolean }): void;
      renderButton(el: HTMLElement, opts: object): void;
    };
  };
};

@Component({
  selector: 'app-auth-forms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-forms.html',
  styleUrl: './auth-forms.css',
})
export class AuthFormsComponent implements AfterViewInit, OnDestroy {
  private authService = inject(AuthService);
  private wardrobeService = inject(WardrobeService);
  private router = inject(Router);
  googleClientId = inject(GOOGLE_CLIENT_ID);
  private platformId = inject(PLATFORM_ID);

  @Output() authenticated = new EventEmitter<void>();
  @ViewChild('googleBtnRef') googleBtnRef!: ElementRef<HTMLDivElement>;

  @Input() set mode(value: 'login' | 'register') {
    this.isLoginMode.set(value === 'login');
  }

  isLoginMode = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showLoginPassword = signal(false);
  showRegisterPassword = signal(false);
  showConfirmPassword = signal(false);

  readonly passwordPolicyMessage = PASSWORD_POLICY_MESSAGE;

  loginEmail = '';
  loginPassword = '';
  rememberMe = false;

  firstName = '';
  lastName = '';
  registerEmail = '';
  registerPassword = '';
  confirmPassword = '';

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.googleClientId) return;
    try {
      google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: (r) => this.onGoogleCredential(r.credential),
        auto_select: false,
      });
      google.accounts.id.renderButton(this.googleBtnRef.nativeElement, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: 360,
      });
    } catch {
      // GIS script not loaded yet — button stays hidden
    }
  }

  ngOnDestroy(): void {}

  setAuthMode(isLogin: boolean): void {
    this.isLoginMode.set(isLogin);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.showLoginPassword.set(false);
    this.showRegisterPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  private async handleSuccess(): Promise<void> {
    this.wardrobeService.initializeData();
    this.authenticated.emit();
    if (!this.authenticated.observed) {
      this.router.navigate(['/dashboard']);
    }
  }

  async onLogin(form?: NgForm): Promise<void> {
    this.errorMessage.set('');
    if (!this.loginEmail || !this.loginPassword) {
      form?.control.markAllAsTouched();
      this.errorMessage.set('Please enter your email and password.');
      return;
    }
    this.isLoading.set(true);
    const request: LoginRequest = { email: this.loginEmail, password: this.loginPassword, rememberMe: this.rememberMe };
    const response = await this.authService.login(request);
    this.isLoading.set(false);
    if (response.success) {
      await this.handleSuccess();
    } else {
      this.errorMessage.set(response.message ?? 'Login failed. Please try again.');
    }
  }

  async onRegister(form?: NgForm): Promise<void> {
    this.errorMessage.set('');
    if (!this.firstName.trim() || !this.lastName.trim() || !this.registerEmail || !this.registerPassword) {
      form?.control.markAllAsTouched();
      this.errorMessage.set('Please complete all required fields.');
      return;
    }
    if (!isPasswordPolicyValid(this.registerPassword)) {
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
    const request: RegisterRequest = {
      email: this.registerEmail,
      password: this.registerPassword,
      firstName: this.firstName.trim() || undefined,
      lastName: this.lastName.trim() || undefined,
    };
    const response = await this.authService.register(request);
    this.isLoading.set(false);
    if (response.success) {
      await this.handleSuccess();
    } else {
      this.errorMessage.set(response.message ?? 'Registration failed. Please try again.');
    }
  }

  async onGoogleCredential(credential: string): Promise<void> {
    this.errorMessage.set('');
    this.isLoading.set(true);
    const response = await this.authService.loginWithGoogle(credential);
    this.isLoading.set(false);
    if (response.success) {
      await this.handleSuccess();
    } else {
      this.errorMessage.set(response.message ?? 'Google sign-in failed. Please try again.');
    }
  }

  hasRegisterPasswordMinLength(): boolean { return hasMinPasswordLength(this.registerPassword); }
  hasRegisterPasswordUppercase(): boolean { return hasUppercaseLetter(this.registerPassword); }
  hasRegisterPasswordSpecialChar(): boolean { return hasSpecialCharacter(this.registerPassword); }
  isRegisterPasswordValid(): boolean { return isPasswordPolicyValid(this.registerPassword); }
  hasStartedRegisterPassword(): boolean { return this.registerPassword.length > 0; }
  hasStartedConfirmPassword(): boolean { return this.confirmPassword.length > 0; }
  doPasswordsMatch(): boolean { return this.registerPassword === this.confirmPassword; }

  isFieldInvalid(f: NgModel | null | undefined): boolean {
    return Boolean(f?.touched && f.invalid);
  }
  isRegisterPasswordFieldInvalid(f: NgModel | null | undefined): boolean {
    return Boolean(f?.touched && (!f.value || !this.isRegisterPasswordValid()));
  }
  isConfirmPasswordInvalid(f: NgModel | null | undefined): boolean {
    return Boolean(f?.touched && (!f.value || !this.doPasswordsMatch()));
  }
  getRegisterEmailError(f: NgModel | null | undefined): string {
    if (!f?.touched) return '';
    if (f.errors?.['required']) return 'Email is required.';
    if (f.errors?.['email']) return 'Enter a valid email address.';
    return '';
  }
  getConfirmPasswordError(f: NgModel | null | undefined): string {
    if (!f?.touched) return '';
    if (!f.value) return 'Please confirm your password.';
    if (!this.doPasswordsMatch()) return 'Passwords do not match.';
    return '';
  }
}
