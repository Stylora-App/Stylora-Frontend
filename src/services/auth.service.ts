import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import { IUser, IAuthResponse, ILoginRequest, IRegisterRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiService = inject(ApiService);
  
  readonly currentUser = signal<IUser | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isLoading = signal(true);

  // Callback for when auth state changes
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
      const response = await this.apiService.get<IAuthResponse>('/auth/me');
      if (response.success && response.user) {
        this.currentUser.set(response.user);
        this.onAuthChangeCallback?.();
        return true;
      }
      this.currentUser.set(null);
      return false;
    } catch (e) {
      this.currentUser.set(null);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  async login(request: ILoginRequest): Promise<IAuthResponse> {
    try {
      const response = await this.apiService.post<IAuthResponse>('/auth/login', request);
      if (response.success && response.user) {
        this.currentUser.set(response.user);
        this.onAuthChangeCallback?.();
      }
      return response;
    } catch (e: any) {
      const errorMessage = e?.message || 'Login failed. Please try again.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  async register(request: IRegisterRequest): Promise<IAuthResponse> {
    try {
      const response = await this.apiService.post<IAuthResponse>('/auth/register', request);
      if (response.success && response.user) {
        this.currentUser.set(response.user);
        this.onAuthChangeCallback?.();
      }
      return response;
    } catch (e: any) {
      const errorMessage = e?.message || 'Registration failed. Please try again.';
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.apiService.post('/auth/logout', {});
    } catch (e) {
      // Ignore errors on logout
    } finally {
      this.currentUser.set(null);
    }
  }

  getDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'Guest';
    if (user.displayName) return user.displayName;
    if (user.firstName) return user.firstName;
    return user.email.split('@')[0];
  }
}
