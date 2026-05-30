import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

let isRefreshing = false;

export const refreshInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const injector = inject(Injector);
  const router = inject(Router);

  if (req.url.includes('/api/auth/refresh')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isRefreshing) {
        isRefreshing = true;
        // Lazy — AuthService is fully constructed by the time catchError fires
        const authService = injector.get(AuthService);

        return from(authService.refreshAccessToken()).pipe(
          switchMap((newToken) => {
            isRefreshing = false;
            if (!newToken) {
              authService.logout();
              router.navigate(['/login']);
              return throwError(() => error);
            }
            return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            injector.get(AuthService).logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
