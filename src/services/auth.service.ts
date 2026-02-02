import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  season?: string;
  subSeason?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiService = inject(ApiService);
  
  readonly currentUser = signal<User | null>(null);
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
      const response = await this.apiService.get<AuthResponse>('/auth/me');
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

  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.apiService.post<AuthResponse>('/auth/login', request);
      if (response.success && response.user) {
        this.currentUser.set(response.user);
        this.onAuthChangeCallback?.();
      }
      return response;
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'Login failed. Please try again.'
      };
    }
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.apiService.post<AuthResponse>('/auth/register', request);
      if (response.success && response.user) {
        this.currentUser.set(response.user);
        this.onAuthChangeCallback?.();
      }
      return response;
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'Registration failed. Please try again.'
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
