import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { compare, hash } from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';

jest.mock('bcryptjs');

const mockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 1,
    nickname: 'aivacol',
    name: 'Aivacol User',
    email: 'aivacol@example.com',
    password: '$2b$10$hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as User;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  const mockCompare = compare as jest.MockedFunction<typeof compare>;
  const mockHash = hash as jest.MockedFunction<typeof hash>;

  beforeEach(async () => {
    usersService = {
      findById: jest.fn(),
      findByNicknameOrEmail: jest.fn(),
      findByEmail: jest.fn(),
      updatePassword: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('returns access_token and refresh_token on valid credentials', async () => {
      const user = mockUser();
      usersService.findByNicknameOrEmail.mockResolvedValue(user);
      mockCompare.mockResolvedValue(true as never);
      cache.set.mockResolvedValue(undefined);

      const result = await service.login('aivacol', 'password123');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('throws UnauthorizedException when user is not found', async () => {
      usersService.findByNicknameOrEmail.mockResolvedValue(null);

      await expect(service.login('unknown', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password does not match', async () => {
      usersService.findByNicknameOrEmail.mockResolvedValue(mockUser());
      mockCompare.mockResolvedValue(false as never);

      await expect(service.login('aivacol', 'wrong-pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('stores the refresh token in cache after successful login', async () => {
      usersService.findByNicknameOrEmail.mockResolvedValue(mockUser());
      mockCompare.mockResolvedValue(true as never);
      cache.set.mockResolvedValue(undefined);

      await service.login('aivacol', 'password123');

      expect(cache.set).toHaveBeenCalledWith(
        'auth:refresh:1',
        expect.any(String),
        expect.any(Number),
      );
    });
  });

  describe('refresh', () => {
    const payload = { sub: 1, nickname: 'aivacol' };

    it('returns a new access_token when refresh token is valid and not revoked', async () => {
      jwtService.verify.mockReturnValue(payload);
      cache.get.mockResolvedValue('valid-refresh-token');

      const result = await service.refresh('valid-refresh-token');

      expect(result).toHaveProperty('access_token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: payload.sub,
        nickname: payload.nickname,
      });
    });

    it('throws UnauthorizedException when the token signature is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the refresh token has been revoked', async () => {
      jwtService.verify.mockReturnValue(payload);
      cache.get.mockResolvedValue('different-stored-token');

      await expect(service.refresh('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('removes the refresh token from cache', async () => {
      cache.del.mockResolvedValue(undefined);

      await service.logout(1);

      expect(cache.del).toHaveBeenCalledWith('auth:refresh:1');
    });
  });

  describe('forgotPassword', () => {
    it('throws NotFoundException when email is not registered', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword('unknown@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('stores a reset token in cache and returns a generic message', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser());
      cache.set.mockResolvedValue(undefined);

      const result = await service.forgotPassword('aivacol@example.com');

      expect(cache.set).toHaveBeenCalledWith(
        expect.stringMatching(/^auth:reset:/),
        1,
        expect.any(Number),
      );
      expect(result).toHaveProperty('message');
    });
  });

  describe('resetPassword', () => {
    it('throws BadRequestException when the reset token is invalid or expired', async () => {
      cache.get.mockResolvedValue(null);

      await expect(service.resetPassword('expired-token', 'NewPass1!')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('updates the hashed password and deletes the reset token from cache', async () => {
      cache.get.mockResolvedValue(1);
      mockHash.mockResolvedValue('new-hashed-password' as never);
      usersService.updatePassword.mockResolvedValue(undefined);
      cache.del.mockResolvedValue(undefined);

      await service.resetPassword('valid-token', 'NewPass1!');

      expect(usersService.updatePassword).toHaveBeenCalledWith(1, 'new-hashed-password');
      expect(cache.del).toHaveBeenCalledWith('auth:reset:valid-token');
    });
  });
});
