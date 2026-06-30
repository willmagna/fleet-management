import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>,
  ) {}

  findById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  findByNicknameOrEmail(login: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.nickname = :login OR user.email = :login', { login })
      .getOne();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    await this.userRepository.update(id, { password: hashedPassword });
  }
}
