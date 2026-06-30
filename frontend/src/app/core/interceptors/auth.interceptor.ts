import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';

// Endpoints that are reachable while logged out — a 401 from these is a normal
// "wrong credentials/expired link" response, not a session that needs clearing.
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
];

function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

// Shared across all interceptor invocations so concurrent 401s trigger a single
// /auth/refresh call instead of one per failed request.
let refreshInFlight$: Observable<string> | null = null;

function refreshAccessToken(auth: AuthService): Observable<string> {
  if (!refreshInFlight$) {
    // finalize runs exactly once for the shared subscription (on success or
    // failure), regardless of how many requests are waiting on it — so the
    // next 401, whenever it happens, starts a fresh refresh call.
    refreshInFlight$ = auth.refreshAccessToken().pipe(
      map((res) => res.access_token),
      finalize(() => (refreshInFlight$ = null)),
      shareReplay(1),
    );
  }
  return refreshInFlight$;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const authReq = withToken(req, auth.getToken());

  return next(authReq).pipe(
    catchError((err: unknown) => {
      const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) => req.url.includes(path));
      const isAuthError = err instanceof HttpErrorResponse && err.status === 401;

      if (!isAuthError || isPublicAuthRequest) {
        return throwError(() => err);
      }

      if (!auth.getRefreshToken()) {
        auth.clearSession();
        router.navigate(['/login']);
        return throwError(() => err);
      }

      return refreshAccessToken(auth).pipe(
        switchMap((newToken) => next(withToken(req, newToken))),
        catchError((refreshErr) => {
          auth.clearSession();
          router.navigate(['/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
