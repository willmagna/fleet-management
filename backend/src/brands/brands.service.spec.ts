import { NotFoundException } from '@nestjs/common';
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

describe('BrandsService', () => {
  let service: BrandsService;
  let repo: jest.Mocked<Repository<Brand>>;

  beforeEach(async () => {
    const mockRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: 'BRAND_REPOSITORY', useValue: mockRepo },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    repo = module.get('BRAND_REPOSITORY');
  });

  describe('findAll', () => {
    it('returns only active brands', async () => {
      const brands = [makeBrand()];
      repo.find.mockResolvedValue(brands);

      const result = await service.findAll();

      expect(result).toEqual(brands);
      expect(repo.find).toHaveBeenCalledWith({ where: { active: true } });
    });

    it('returns empty array when no active brands exist', async () => {
      repo.find.mockResolvedValue([]);

      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns the brand when found and active', async () => {
      const brand = makeBrand();
      repo.findOneBy.mockResolvedValue(brand);

      const result = await service.findOne('1');

      expect(result).toEqual(brand);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1, active: true });
    });

    it('throws NotFoundException when brand does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('99')).rejects.toThrow(NotFoundException);
    });

    it('does not return inactive (soft-deleted) brands', async () => {
      // The active:true filter causes findOneBy to return null for inactive records
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
  });

  describe('update', () => {
    it('updates existing brand and sets updatedBy to the authenticated user', async () => {
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

    it('throws NotFoundException when brand does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.update('99', { name: 'X' }, 'aivacol')).rejects.toThrow(
        NotFoundException,
      );
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

    it('throws NotFoundException when brand does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('99', 'aivacol')).rejects.toThrow(NotFoundException);
    });
  });
});
