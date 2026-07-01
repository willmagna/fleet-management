import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async login(login: string, password: string) {
    const user = await this.usersService.findByNicknameOrEmail(login);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const payload: JwtPayload = { sub: user.id, nickname: user.nickname };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as any,
    });

    const ttl =
      Number(process.env.JWT_REFRESH_EXPIRES_IN?.replace('d', '') ?? 7) *
      24 *
      60 *
      60 *
      1000;
    await this.cache.set(`auth:refresh:${user.id}`, refreshToken, ttl);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.cache.get<string>(`auth:refresh:${payload.sub}`);
    if (stored !== refreshToken)
      throw new UnauthorizedException('Refresh token revoked');

    const newPayload: JwtPayload = {
      sub: payload.sub,
      nickname: payload.nickname,
    };
    return { access_token: this.jwtService.sign(newPayload) };
  }

  async logout(userId: number): Promise<void> {
    await this.cache.del(`auth:refresh:${userId}`);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const token = randomUUID();
    await this.cache.set(`auth:reset:${token}`, user.id, 60 * 60 * 1000);

    console.log(`[Password Reset] token for ${email}: ${token}`);

    return {
      message: 'If this email exists, a reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.cache.get<number>(`auth:reset:${token}`);
    if (!userId) throw new BadRequestException('Invalid or expired token');

    const hashed = await hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hashed);
    await this.cache.del(`auth:reset:${token}`);
  }
}
