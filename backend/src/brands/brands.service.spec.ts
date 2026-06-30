import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Brand } from './brand.entity';
import { BrandsService } from './brands.service';

const makeBrand = (overrides: Partial<Brand> = {}): Brand =>
  ({
    id: 1,
    name: 'Toyota',
    active: true,
    createdBy: 'aivacol',
    updatedBy: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }) as Brand;

const mockRabbitClient = () => ({
  emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
});

describe('BrandsService', () => {
  let service: BrandsService;
  let repo: jest.Mocked<Repository<Brand>>;
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let rabbitClient: ReturnType<typeof mockRabbitClient>;

  beforeEach(async () => {
    const mockRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
    rabbitClient = mockRabbitClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: 'BRAND_REPOSITORY', useValue: mockRepo },
        { provide: CACHE_MANAGER, useValue: cache },
        { provide: 'RABBITMQ_CLIENT', useValue: rabbitClient },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    repo = module.get('BRAND_REPOSITORY');
  });

  describe('findAll', () => {
    it('returns cached brands without hitting the database', async () => {
      const brands = [makeBrand()];
      cache.get.mockResolvedValue(brands);

      const result = await service.findAll();

      expect(result).toEqual(brands);
      expect(cache.get).toHaveBeenCalledWith('brands:all');
      expect(repo.find).not.toHaveBeenCalled();
    });

    it('queries the database on cache miss, returns only active brands and caches the result', async () => {
      const brands = [makeBrand()];
      repo.find.mockResolvedValue(brands);

      const result = await service.findAll();

      expect(result).toEqual(brands);
      expect(repo.find).toHaveBeenCalledWith({ where: { active: true } });
      expect(cache.set).toHaveBeenCalledWith('brands:all', brands);
    });

    it('returns empty array when no active brands exist', async () => {
      repo.find.mockResolvedValue([]);

      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns the cached brand without hitting the database', async () => {
      const brand = makeBrand();
      cache.get.mockResolvedValue(brand);

      const result = await service.findOne('1');

      expect(result).toEqual(brand);
      expect(cache.get).toHaveBeenCalledWith('brands:1');
      expect(repo.findOneBy).not.toHaveBeenCalled();
    });

    it('queries the database on cache miss and caches the result', async () => {
      const brand = makeBrand();
      repo.findOneBy.mockResolvedValue(brand);

      const result = await service.findOne('1');

      expect(result).toEqual(brand);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1, active: true });
      expect(cache.set).toHaveBeenCalledWith('brands:1', brand);
    });

    it('throws NotFoundException when brand does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('99')).rejects.toThrow(NotFoundException);
    });

    it('does not return inactive (soft-deleted) brands', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1, active: true });
    });
  });

  describe('create', () => {
    it('assigns createdBy from the authenticated user nickname', async () => {
      const payload = { name: 'Honda' };
      const brand = makeBrand({ name: 'Honda', createdBy: 'aivacol' });
      repo.create.mockReturnValue(brand);
      repo.save.mockResolvedValue(brand);

      const result = await service.create(payload, 'aivacol');

      expect(repo.create).toHaveBeenCalledWith({ name: 'Honda', createdBy: 'aivacol' });
      expect(repo.save).toHaveBeenCalledWith(brand);
      expect(result).toEqual(brand);
    });

    it('emits a fleet.audit event after creating a brand', async () => {
      const brand = makeBrand();
      repo.create.mockReturnValue(brand);
      repo.save.mockResolvedValue(brand);

      await service.create({ name: 'Toyota' }, 'aivacol');

      expect(rabbitClient.emit).toHaveBeenCalledWith(
        'fleet.audit',
        expect.objectContaining({ action: 'created', entity: 'brand', entityId: brand.id }),
      );
    });

    it('invalidates the list cache after creating a brand', async () => {
      const brand = makeBrand();
      repo.create.mockReturnValue(brand);
      repo.save.mockResolvedValue(brand);

      await service.create({ name: 'Toyota' }, 'aivacol');

      expect(cache.del).toHaveBeenCalledWith('brands:all');
    });
  });

  describe('update', () => {
    it('updates existing brand and sets updatedBy', async () => {
      const brand = makeBrand();
      const updated = makeBrand({ name: 'Toyota Updated', updatedBy: 'aivacol' });
      repo.findOneBy
        .mockResolvedValueOnce(brand)
        .mockResolvedValueOnce(updated);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      const result = await service.update('1', { name: 'Toyota Updated' }, 'aivacol');

      expect(repo.update).toHaveBeenCalledWith('1', {
        name: 'Toyota Updated',
        updatedBy: 'aivacol',
      });
      expect(result).toEqual(updated);
    });

    it('emits a fleet.audit event after updating', async () => {
      const brand = makeBrand();
      const updated = makeBrand({ name: 'Toyota Updated', updatedBy: 'aivacol' });
      repo.findOneBy.mockResolvedValueOnce(brand).mockResolvedValueOnce(updated);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.update('1', { name: 'Toyota Updated' }, 'aivacol');

      expect(rabbitClient.emit).toHaveBeenCalledWith(
        'fleet.audit',
        expect.objectContaining({ action: 'updated', entity: 'brand', entityId: 1 }),
      );
    });

    it('throws NotFoundException when brand does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.update('99', { name: 'X' }, 'aivacol')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('invalidates the list and item cache after updating', async () => {
      const brand = makeBrand();
      const updated = makeBrand({ name: 'Toyota Updated', updatedBy: 'aivacol' });
      repo.findOneBy.mockResolvedValueOnce(brand).mockResolvedValueOnce(updated);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.update('1', { name: 'Toyota Updated' }, 'aivacol');

      expect(cache.del).toHaveBeenCalledWith('brands:all');
      expect(cache.del).toHaveBeenCalledWith('brands:1');
    });
  });

  describe('remove', () => {
    it('soft-deletes by setting active=false and recording updatedBy', async () => {
      const brand = makeBrand();
      repo.findOneBy.mockResolvedValue(brand);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      const result = await service.remove('1', 'aivacol');

      expect(repo.update).toHaveBeenCalledWith('1', {
        active: false,
        updatedBy: 'aivacol',
      });
      expect(result).toEqual({ status: 'ok', message: 'brand id: 1 has been deleted' });
    });

    it('invalidates the list and item cache after removing', async () => {
      const brand = makeBrand();
      repo.findOneBy.mockResolvedValue(brand);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.remove('1', 'aivacol');

      expect(cache.del).toHaveBeenCalledWith('brands:all');
      expect(cache.del).toHaveBeenCalledWith('brands:1');
    });

    it('emits a fleet.audit event after removing', async () => {
      const brand = makeBrand();
      repo.findOneBy.mockResolvedValue(brand);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.remove('1', 'aivacol');

      expect(rabbitClient.emit).toHaveBeenCalledWith(
        'fleet.audit',
        expect.objectContaining({ action: 'deleted', entity: 'brand', entityId: 1 }),
      );
    });

    it('throws NotFoundException when brand does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('99', 'aivacol')).rejects.toThrow(NotFoundException);
    });
  });
});
