import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { LayoutComponent } from './layout.component';
import { AuthService } from '../../services/auth.service';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let auth: { logout: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    auth = { logout: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });

    component = TestBed.createComponent(LayoutComponent).componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('delegates logout() to AuthService', () => {
    component.logout();

    expect(auth.logout).toHaveBeenCalledTimes(1);
  });
});
