import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { VehiclesService } from './vehicles.service';

const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle =>
  ({
    id: 1,
    licensePlate: 'ABC-1234',
    chassis: 'CHS0000001',
    renavam: '12345678901',
    year: 2022,
    modelId: 1,
    active: true,
    createdBy: 'aivacol',
    updatedBy: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }) as Vehicle;

describe('VehiclesService', () => {
  let service: VehiclesService;
  let repo: jest.Mocked<Repository<Vehicle>>;
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    const mockRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: 'VEHICLE_REPOSITORY', useValue: mockRepo },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    repo = module.get('VEHICLE_REPOSITORY');
  });

  describe('findAll', () => {
    it('returns cached vehicles without hitting the database', async () => {
      const vehicles = [makeVehicle()];
      cache.get.mockResolvedValue(vehicles);

      const result = await service.findAll();

      expect(result).toEqual(vehicles);
      expect(cache.get).toHaveBeenCalledWith('vehicles:all');
      expect(repo.find).not.toHaveBeenCalled();
    });

    it('queries the database on cache miss and stores the result in cache', async () => {
      const vehicles = [makeVehicle()];
      cache.get.mockResolvedValue(null);
      repo.find.mockResolvedValue(vehicles);

      const result = await service.findAll();

      expect(result).toEqual(vehicles);
      expect(repo.find).toHaveBeenCalledWith({ where: { active: true } });
      expect(cache.set).toHaveBeenCalledWith('vehicles:all', vehicles);
    });
  });

  describe('findOne', () => {
    it('returns a cached vehicle without hitting the database', async () => {
      const vehicle = makeVehicle();
      cache.get.mockResolvedValue(vehicle);

      const result = await service.findOne('1');

      expect(result).toEqual(vehicle);
      expect(cache.get).toHaveBeenCalledWith('vehicles:1');
      expect(repo.findOneBy).not.toHaveBeenCalled();
    });

    it('queries the database on cache miss and caches the individual vehicle', async () => {
      const vehicle = makeVehicle();
      cache.get.mockResolvedValue(null);
      repo.findOneBy.mockResolvedValue(vehicle);

      const result = await service.findOne('1');

      expect(result).toEqual(vehicle);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1, active: true });
      expect(cache.set).toHaveBeenCalledWith('vehicles:1', vehicle);
    });

    it('throws NotFoundException when vehicle does not exist', async () => {
      cache.get.mockResolvedValue(null);
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('99')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('persists the vehicle, assigns createdBy, and invalidates the list cache', async () => {
      const payload = { licensePlate: 'DEF-5678', modelId: 1, year: 2023 };
      const vehicle = makeVehicle({ licensePlate: 'DEF-5678', createdBy: 'aivacol' });
      repo.create.mockReturnValue(vehicle);
      repo.save.mockResolvedValue(vehicle);

      const result = await service.create(payload, 'aivacol');

      expect(repo.create).toHaveBeenCalledWith({ ...payload, createdBy: 'aivacol' });
      expect(cache.del).toHaveBeenCalledWith('vehicles:all');
      expect(result).toEqual(vehicle);
    });
  });

  describe('update', () => {
    it('updates the vehicle, sets updatedBy, and invalidates both cache keys', async () => {
      const vehicle = makeVehicle();
      const updated = makeVehicle({ year: 2023, updatedBy: 'aivacol' });
      cache.get
        .mockResolvedValueOnce(vehicle)   // findOne check before update
        .mockResolvedValueOnce(null)       // findOne cache miss after update
        .mockResolvedValueOnce(null);      // findOne cache miss for return
      repo.findOneBy.mockResolvedValue(updated);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.update('1', { year: 2023 }, 'aivacol');

      expect(repo.update).toHaveBeenCalledWith('1', { year: 2023, updatedBy: 'aivacol' });
      expect(cache.del).toHaveBeenCalledWith('vehicles:all');
      expect(cache.del).toHaveBeenCalledWith('vehicles:1');
    });

    it('throws NotFoundException when vehicle does not exist', async () => {
      cache.get.mockResolvedValue(null);
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.update('99', { year: 2023 }, 'aivacol')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes the vehicle and invalidates both cache keys', async () => {
      const vehicle = makeVehicle();
      cache.get.mockResolvedValue(vehicle);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      const result = await service.remove('1', 'aivacol');

      expect(repo.update).toHaveBeenCalledWith('1', {
        active: false,
        updatedBy: 'aivacol',
      });
      expect(cache.del).toHaveBeenCalledWith('vehicles:all');
      expect(cache.del).toHaveBeenCalledWith('vehicles:1');
      expect(result).toEqual({ status: 'ok', message: 'vehicle id: 1 has been deleted' });
    });

    it('throws NotFoundException when vehicle does not exist', async () => {
      cache.get.mockResolvedValue(null);
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('99', 'aivacol')).rejects.toThrow(NotFoundException);
    });
  });
});
