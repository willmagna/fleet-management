import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('login', () => {
    it('posts credentials and stores both tokens on success', () => {
      let result: unknown;
      service.login({ login: 'aivacol', password: 'aivacol' }).subscribe((res) => (result = res));

      const req = httpMock.expectOne(`${API}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ login: 'aivacol', password: 'aivacol' });
      req.flush({ access_token: 'access-1', refresh_token: 'refresh-1' });

      expect(result).toEqual({ access_token: 'access-1', refresh_token: 'refresh-1' });
      expect(localStorage.getItem('aivacol_access_token')).toBe('access-1');
      expect(localStorage.getItem('aivacol_refresh_token')).toBe('refresh-1');
    });

    it('does not store anything when login fails', () => {
      service.login({ login: 'aivacol', password: 'wrong' }).subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${API}/auth/login`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(localStorage.getItem('aivacol_access_token')).toBeNull();
    });
  });

  describe('refreshAccessToken', () => {
    it('posts the stored refresh token and updates the stored access token', () => {
      localStorage.setItem('aivacol_refresh_token', 'refresh-1');

      let result: unknown;
      service.refreshAccessToken().subscribe((res) => (result = res));

      const req = httpMock.expectOne(`${API}/auth/refresh`);
      expect(req.request.body).toEqual({ refresh_token: 'refresh-1' });
      req.flush({ access_token: 'access-2' });

      expect(result).toEqual({ access_token: 'access-2' });
      expect(localStorage.getItem('aivacol_access_token')).toBe('access-2');
    });
  });

  describe('logout', () => {
    it('calls /auth/logout, clears storage and navigates to /login', () => {
      localStorage.setItem('aivacol_access_token', 'access-1');
      localStorage.setItem('aivacol_refresh_token', 'refresh-1');

      service.logout();

      const req = httpMock.expectOne(`${API}/auth/logout`);
      expect(req.request.body).toEqual({ refresh_token: 'refresh-1' });
      req.flush({});

      expect(localStorage.getItem('aivacol_access_token')).toBeNull();
      expect(localStorage.getItem('aivacol_refresh_token')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('still clears storage and navigates even when the logout request fails', () => {
      localStorage.setItem('aivacol_refresh_token', 'refresh-1');

      service.logout();

      const req = httpMock.expectOne(`${API}/auth/logout`);
      req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' });

      expect(localStorage.getItem('aivacol_refresh_token')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('skips the logout call when there is no refresh token, but still clears and navigates', () => {
      service.logout();

      httpMock.expectNone(`${API}/auth/logout`);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('clearSession', () => {
    it('removes both tokens from localStorage', () => {
      localStorage.setItem('aivacol_access_token', 'a');
      localStorage.setItem('aivacol_refresh_token', 'b');

      service.clearSession();

      expect(localStorage.getItem('aivacol_access_token')).toBeNull();
      expect(localStorage.getItem('aivacol_refresh_token')).toBeNull();
    });
  });

  describe('getToken / getRefreshToken / isLoggedIn', () => {
    it('reflects whatever is in localStorage', () => {
      expect(service.isLoggedIn()).toBe(false);

      localStorage.setItem('aivacol_access_token', 'access-1');
      expect(service.getToken()).toBe('access-1');
      expect(service.isLoggedIn()).toBe(true);

      localStorage.setItem('aivacol_refresh_token', 'refresh-1');
      expect(service.getRefreshToken()).toBe('refresh-1');
    });
  });
});
