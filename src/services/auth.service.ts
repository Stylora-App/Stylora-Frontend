import { Injectable, signal, computed, inject } from '@angular/core';
import { Api } from '@/openapi_generated/api';
import { getMe } from '@/openapi_generated/fn/auth/get-me';
import { login } from '@/openapi_generated/fn/auth/login';
import { logout } from '@/openapi_generated/fn/auth/logout';
import { register } from '@/openapi_generated/fn/auth/register';
import { changePassword } from '@/openapi_generated/fn/auth/change-password';
import type { UserDto } from '@/openapi_generated/models/user-dto';
import type { AuthResponse } from '@/openapi_generated/models/auth-response';
import type { LoginRequest } from '@/openapi_generated/models/login-request';
import type { RegisterRequest } from '@/openapi_generated/models/register-request';
import type { ChangePasswordRequest } from '@/openapi_generated/models/change-password-request';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(Api);

  readonly currentUser = signal<UserDto | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isLoading = signal(true);

  private onAuthChangeCallback: (() => void) | null = null;

  constructor() {
    this.checkAuthStatus();
  }

  setOnAuthChangeCallback(callback: () => void) {
    this.onAuthChangeCallback = callback;
  }

  async checkAuthStatus(): Promise<boolean> {
    this.isLoading.set(true);
    try {
      const response = await this.api.invoke(getMe);
      if (response.success && response.user) {
        this.currentUser.set(response.user);
        this.onAuthChangeCallback?.();
        return true;
      }
      this.currentUser.set(null);
      return false;
    } catch {
      this.currentUser.set(null);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.invoke(login, { body: request });
      if (response.success && response.user) {
        this.currentUser.set(response.user);
        this.onAuthChangeCallback?.();
      }
      return response;
    } catch (e: any) {
      return { success: false, message: e?.error?.message || e?.message || 'Login failed. Please try again.' };
    }
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.invoke(register, { body: request });
      if (response.success && response.user) {
        this.currentUser.set(response.user);
        this.onAuthChangeCallback?.();
      }
      return response;
    } catch (e: any) {
      return { success: false, message: e?.error?.message || e?.message || 'Registration failed. Please try again.' };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.invoke(logout);
    } catch {
      // ignore errors on logout
    } finally {
      this.currentUser.set(null);
    }
  }

  async changePassword(request: ChangePasswordRequest): Promise<AuthResponse> {
    try {
      return await this.api.invoke(changePassword, { body: request });
    } catch (e: any) {
      return { success: false, message: e?.error?.message || e?.message || 'Failed to change password. Please try again.' };
    }
  }

  getDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'Guest';
    if (user.firstName) return user.firstName;
    return (user.email ?? '').split('@')[0];
  }
}
