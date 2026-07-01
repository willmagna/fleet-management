import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../../services/auth.service';

describe('authGuard', () => {
  let authService: { isLoggedIn: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = { isLoggedIn: vi.fn() };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authGuard({} as any, {} as any),
    );

  it('allows navigation when the user is logged in', () => {
    authService.isLoggedIn.mockReturnValue(true);

    const result = runGuard();

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects to /login and blocks navigation when the user is not logged in', () => {
    authService.isLoggedIn.mockReturnValue(false);

    const result = runGuard();

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
