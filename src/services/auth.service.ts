import { Injectable, signal, computed, inject } from '@angular/core';
import { Api } from '@/openapi_generated/api';
import { googleAuth } from '@/openapi_generated/fn/auth/google-auth';
import { login } from '@/openapi_generated/fn/auth/login';
import { logout } from '@/openapi_generated/fn/auth/logout';
import { refreshToken } from '@/openapi_generated/fn/auth/refresh-token';
import { register } from '@/openapi_generated/fn/auth/register';
import { changePassword } from '@/openapi_generated/fn/auth/change-password';
import type { UserDto } from '@/openapi_generated/models/user-dto';
import type { AuthResponse } from '@/openapi_generated/models/auth-response';
import type { LoginRequest } from '@/openapi_generated/models/login-request';
import type { RegisterRequest } from '@/openapi_generated/models/register-request';
import type { ChangePasswordRequest } from '@/openapi_generated/models/change-password-request';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(Api);
  private tokenService = inject(TokenService);

  readonly currentUser = signal<UserDto | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isLoading = signal(true);

  private onAuthChangeCallback: (() => void) | null = null;

  constructor() {
    this.restoreSession();
  }

  setOnAuthChangeCallback(callback: () => void) {
    this.onAuthChangeCallback = callback;
  }

  private async restoreSession(): Promise<void> {
    this.isLoading.set(true);
    try {
      const storedRefresh = this.tokenService.getRefresh();
      if (!storedRefresh) return;

      const response = await this.api.invoke(refreshToken, { body: { refreshToken: storedRefresh } });
      if (response.success && response.accessToken && response.refreshToken && response.user) {
        this.tokenService.set(response.accessToken);
        this.tokenService.setRefresh(response.refreshToken);
        this.currentUser.set(response.user);
        this.onAuthChangeCallback?.();
      } else {
        this.tokenService.clear();
      }
    } catch {
      this.tokenService.clear();
    } finally {
      this.isLoading.set(false);
    }
  }

  private handleAuthResponse(response: AuthResponse): void {
    if (response.success && response.accessToken && response.refreshToken && response.user) {
      this.tokenService.set(response.accessToken);
      this.tokenService.setRefresh(response.refreshToken);
      this.currentUser.set(response.user);
      this.onAuthChangeCallback?.();
    }
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.invoke(login, { body: request });
      this.handleAuthResponse(response);
      return response;
    } catch (e: any) {
      return { success: false, message: e?.error?.message ?? e?.message ?? 'Login failed. Please try again.' };
    }
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.invoke(register, { body: request });
      this.handleAuthResponse(response);
      return response;
    } catch (e: any) {
      return { success: false, message: e?.error?.message ?? e?.message ?? 'Registration failed. Please try again.' };
    }
  }

  async loginWithGoogle(credential: string): Promise<AuthResponse> {
    try {
      const response = await this.api.invoke(googleAuth, { body: { credential } });
      this.handleAuthResponse(response);
      return response;
    } catch (e: any) {
      return { success: false, message: e?.error?.message ?? e?.message ?? 'Google sign-in failed. Please try again.' };
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    try {
      const storedRefresh = this.tokenService.getRefresh();
      if (!storedRefresh) return null;

      const response = await this.api.invoke(refreshToken, { body: { refreshToken: storedRefresh } });
      if (response.success && response.accessToken && response.refreshToken && response.user) {
        this.tokenService.set(response.accessToken);
        this.tokenService.setRefresh(response.refreshToken);
        this.currentUser.set(response.user);
        return response.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.invoke(logout);
    } catch {
      // ignore errors
    } finally {
      this.tokenService.clear();
      this.currentUser.set(null);
    }
  }

  async changePassword(request: ChangePasswordRequest): Promise<AuthResponse> {
    try {
      return await this.api.invoke(changePassword, { body: request });
    } catch (e: any) {
      return { success: false, message: e?.error?.message ?? e?.message ?? 'Failed to change password. Please try again.' };
    }
  }

  getDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'Guest';
    if (user.firstName) return user.firstName;
    return (user.email ?? '').split('@')[0];
  }
}
