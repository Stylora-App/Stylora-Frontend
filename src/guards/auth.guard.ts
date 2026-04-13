import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoading()) {
    await firstValueFrom(
      toObservable(authService.isLoading).pipe(filter(v => !v))
    );
  }

  return authService.isAuthenticated() || router.createUrlTree(['/login']);
};

/** Redirect already-authenticated users away from /login */
export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoading()) {
    await firstValueFrom(
      toObservable(authService.isLoading).pipe(filter(v => !v))
    );
  }

  return !authService.isAuthenticated() || router.createUrlTree(['/dashboard']);
};
