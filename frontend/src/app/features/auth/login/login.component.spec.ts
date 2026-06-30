import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let auth: { login: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    auth = { login: vi.fn() };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    component = TestBed.createComponent(LoginComponent).componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('does not call AuthService.login when the form is invalid', () => {
    component.form.setValue({ login: '', password: '' });

    component.submit();

    expect(auth.login).not.toHaveBeenCalled();
  });

  it('logs in and navigates to /vehicles on success', () => {
    auth.login.mockReturnValue(of({ access_token: 'a', refresh_token: 'r' }));
    component.form.setValue({ login: 'aivacol', password: 'aivacol' });

    component.submit();

    expect(auth.login).toHaveBeenCalledWith({ login: 'aivacol', password: 'aivacol' });
    expect(router.navigate).toHaveBeenCalledWith(['/vehicles']);
    expect(component.error()).toBe('');
  });

  it('shows a specific message on invalid credentials (401)', () => {
    auth.login.mockReturnValue(
      throwError(() => ({ status: 401 })),
    );
    component.form.setValue({ login: 'aivacol', password: 'wrong-password' });

    component.submit();

    expect(component.error()).toBe('Credenciais inválidas. Verifique seu usuário e senha.');
    expect(component.loading()).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows a generic message on other errors', () => {
    auth.login.mockReturnValue(throwError(() => ({ status: 500 })));
    component.form.setValue({ login: 'aivacol', password: 'aivacol' });

    component.submit();

    expect(component.error()).toBe('Erro ao conectar. Tente novamente.');
  });

  it('toggles password visibility', () => {
    expect(component.hidePassword()).toBe(true);
    component.hidePassword.set(!component.hidePassword());
    expect(component.hidePassword()).toBe(false);
  });
});
