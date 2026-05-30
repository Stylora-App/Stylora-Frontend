import { Injectable } from '@angular/core';

const REFRESH_KEY = 'stylora_refresh';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private accessToken: string | null = null;

  // Access token — in memory only (lost on reload, refreshed via refresh token)
  set(token: string | null): void { this.accessToken = token; }
  get(): string | null { return this.accessToken; }

  // Refresh token — persisted in localStorage across reloads
  setRefresh(token: string): void { localStorage.setItem(REFRESH_KEY, token); }
  getRefresh(): string | null { return localStorage.getItem(REFRESH_KEY); }

  clear(): void {
    this.accessToken = null;
    localStorage.removeItem(REFRESH_KEY);
  }
}
