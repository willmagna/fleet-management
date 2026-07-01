import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './login.dto';
import { ForgotPasswordDto } from './forgot-password.dto';
import { ResetPasswordDto } from './reset-password.dto';
import { RefreshTokenDto } from './refresh-token.dto';

describe('Auth DTOs — validações', () => {
  describe('LoginDto', () => {
    it('passes validation with valid credentials', async () => {
      const dto = plainToInstance(LoginDto, { login: 'aivacol', password: 'secret123' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('fails when login is empty', async () => {
      const dto = plainToInstance(LoginDto, { login: '', password: 'secret123' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'login')).toBe(true);
    });

    it('fails when password is empty', async () => {
      const dto = plainToInstance(LoginDto, { login: 'aivacol', password: '' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('fails when login is missing', async () => {
      const dto = plainToInstance(LoginDto, { password: 'secret123' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'login')).toBe(true);
    });

    it('fails when password is missing', async () => {
      const dto = plainToInstance(LoginDto, { login: 'aivacol' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('fails when login is not a string', async () => {
      const dto = plainToInstance(LoginDto, { login: 123, password: 'secret' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'login')).toBe(true);
    });
  });

  describe('ForgotPasswordDto', () => {
    it('passes validation with a valid email', async () => {
      const dto = plainToInstance(ForgotPasswordDto, { email: 'user@example.com' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('fails when email format is invalid', async () => {
      const dto = plainToInstance(ForgotPasswordDto, { email: 'not-an-email' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('fails when email is empty', async () => {
      const dto = plainToInstance(ForgotPasswordDto, { email: '' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('fails when email is missing', async () => {
      const dto = plainToInstance(ForgotPasswordDto, {});
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });
  });

  describe('ResetPasswordDto', () => {
    it('passes validation with a valid token and password with at least 6 chars', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'some-uuid-token',
        password: 'secure1',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('fails when password has fewer than 6 characters', async () => {
      const dto = plainToInstance(ResetPasswordDto, { token: 'abc', password: '12345' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('fails when token is empty', async () => {
      const dto = plainToInstance(ResetPasswordDto, { token: '', password: 'secure1' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'token')).toBe(true);
    });

    it('fails when token is missing', async () => {
      const dto = plainToInstance(ResetPasswordDto, { password: 'secure1' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'token')).toBe(true);
    });
  });

  describe('RefreshTokenDto', () => {
    it('passes validation with a valid refresh_token', async () => {
      const dto = plainToInstance(RefreshTokenDto, { refresh_token: 'eyJhbGci...' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('fails when refresh_token is empty', async () => {
      const dto = plainToInstance(RefreshTokenDto, { refresh_token: '' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'refresh_token')).toBe(true);
    });

    it('fails when refresh_token is missing', async () => {
      const dto = plainToInstance(RefreshTokenDto, {});
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'refresh_token')).toBe(true);
    });
  });
});
