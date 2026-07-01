import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: {
    getToken: ReturnType<typeof vi.fn>;
    getRefreshToken: ReturnType<typeof vi.fn>;
    refreshAccessToken: ReturnType<typeof vi.fn>;
    clearSession: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    auth = {
      getToken: vi.fn().mockReturnValue('access-1'),
      getRefreshToken: vi.fn().mockReturnValue('refresh-1'),
      refreshAccessToken: vi.fn(),
      clearSession: vi.fn(),
    };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('attaches the bearer token to outgoing requests', () => {
    http.get('/brands').subscribe();

    const req = httpMock.expectOne('/brands');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    req.flush([]);
  });

  it('does not attach an Authorization header when there is no token', () => {
    auth.getToken.mockReturnValue(null);

    http.get('/brands').subscribe();

    const req = httpMock.expectOne('/brands');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('refreshes the token on 401 and retries the original request with the new token', () => {
    auth.refreshAccessToken.mockReturnValue(of({ access_token: 'access-2' }));

    let result: unknown;
    http.get('/brands').subscribe((res) => (result = res));

    const firstReq = httpMock.expectOne('/brands');
    expect(firstReq.request.headers.get('Authorization')).toBe('Bearer access-1');
    firstReq.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const retryReq = httpMock.expectOne('/brands');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer access-2');
    retryReq.flush([{ id: 1 }]);

    expect(result).toEqual([{ id: 1 }]);
    expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(auth.clearSession).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not attempt a refresh for 401s from public auth endpoints', () => {
    let error: unknown;
    http.post('/auth/login', {}).subscribe({ error: (err) => (error = err) });

    const req = httpMock.expectOne('/auth/login');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(error).toBeTruthy();
    expect(auth.refreshAccessToken).not.toHaveBeenCalled();
    expect(auth.clearSession).not.toHaveBeenCalled();
  });

  it('clears the session and redirects to /login on 401 when there is no refresh token', () => {
    auth.getRefreshToken.mockReturnValue(null);

    let error: unknown;
    http.get('/brands').subscribe({ error: (err) => (error = err) });

    const req = httpMock.expectOne('/brands');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(error).toBeTruthy();
    expect(auth.refreshAccessToken).not.toHaveBeenCalled();
    expect(auth.clearSession).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('clears the session and redirects to /login when the refresh call itself fails', () => {
    auth.refreshAccessToken.mockReturnValue(
      throwError(() => new Error('refresh token expired')),
    );

    let error: unknown;
    http.get('/brands').subscribe({ error: (err) => (error = err) });

    const req = httpMock.expectOne('/brands');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(error).toBeTruthy();
    expect(auth.clearSession).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('shares a single refresh call across concurrent 401s', () => {
    // A real /auth/refresh call is asynchronous, so two requests that fail
    // around the same time both join the same in-flight refresh. `of(...)`
    // resolves synchronously and would reset the dedup state before the
    // second 401 even arrives, so a manually-controlled Subject is used here
    // to emit the refreshed token only after both requests have failed.
    const refresh$ = new Subject<{ access_token: string }>();
    auth.refreshAccessToken.mockReturnValue(refresh$);

    const results: unknown[] = [];
    http.get('/brands').subscribe((res) => results.push(res));
    http.get('/models').subscribe((res) => results.push(res));

    const brandsReq = httpMock.expectOne('/brands');
    const modelsReq = httpMock.expectOne('/models');
    brandsReq.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    modelsReq.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);

    refresh$.next({ access_token: 'access-2' });
    refresh$.complete();

    const brandsRetry = httpMock.expectOne('/brands');
    const modelsRetry = httpMock.expectOne('/models');
    expect(brandsRetry.request.headers.get('Authorization')).toBe('Bearer access-2');
    expect(modelsRetry.request.headers.get('Authorization')).toBe('Bearer access-2');
    brandsRetry.flush([{ id: 1 }]);
    modelsRetry.flush([{ id: 2 }]);

    expect(results).toHaveLength(2);
    expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
  });
});
