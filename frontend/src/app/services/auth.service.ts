import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest } from '../core/models/auth.model';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;
const TOKEN_KEY = 'aivacol_access_token';
const REFRESH_KEY = 'aivacol_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/auth/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        localStorage.setItem(REFRESH_KEY, res.refresh_token);
      }),
    );
  }

  refreshAccessToken(): Observable<{ access_token: string }> {
    return this.http
      .post<{ access_token: string }>(`${API}/auth/refresh`, {
        refresh_token: this.getRefreshToken(),
      })
      .pipe(tap((res) => localStorage.setItem(TOKEN_KEY, res.access_token)));
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http
        .post(`${API}/auth/logout`, { refresh_token: refreshToken })
        .subscribe({ error: () => {} });
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
