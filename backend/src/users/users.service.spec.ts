import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 1,
    nickname: 'aivacol',
    name: 'Aivacol User',
    email: 'aivacol@example.com',
    password: '$2b$10$hashed',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as User;

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    const mockRepo = {
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: 'USER_REPOSITORY', useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get('USER_REPOSITORY');

    // Reset query builder mocks between tests
    jest.clearAllMocks();
    repo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
  });

  describe('findById', () => {
    it('returns the user when found', async () => {
      const user = makeUser();
      repo.findOneBy.mockResolvedValue(user);

      const result = await service.findById(1);

      expect(result).toEqual(user);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('returns null when user does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      expect(await service.findById(99)).toBeNull();
    });
  });

  describe('findByNicknameOrEmail', () => {
    it('finds user by nickname using OR query', async () => {
      const user = makeUser();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.getOne.mockResolvedValue(user);

      const result = await service.findByNicknameOrEmail('aivacol');

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.nickname = :login OR user.email = :login',
        { login: 'aivacol' },
      );
      expect(result).toEqual(user);
    });

    it('returns null when neither nickname nor email matches', async () => {
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.getOne.mockResolvedValue(null);

      expect(await service.findByNicknameOrEmail('unknown')).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns user when email is registered', async () => {
      const user = makeUser();
      repo.findOneBy.mockResolvedValue(user);

      const result = await service.findByEmail('aivacol@example.com');

      expect(result).toEqual(user);
      expect(repo.findOneBy).toHaveBeenCalledWith({ email: 'aivacol@example.com' });
    });

    it('returns null when email is not registered', async () => {
      repo.findOneBy.mockResolvedValue(null);

      expect(await service.findByEmail('nope@example.com')).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('updates the password hash for the given user id', async () => {
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.updatePassword(1, 'new-hashed-password');

      expect(repo.update).toHaveBeenCalledWith(1, { password: 'new-hashed-password' });
    });
  });
});
