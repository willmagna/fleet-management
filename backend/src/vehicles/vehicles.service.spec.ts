import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { VehicleStatusHistory } from './vehicle-status-history.entity';
import { VehiclesService } from './vehicles.service';

const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle =>
  ({
    id: 1,
    licensePlate: 'ABC-1234',
    chassis: 'CHS0000001',
    renavam: '12345678901',
    year: 2022,
    modelId: 1,
    status: 'disponivel',
    active: true,
    createdBy: 'aivacol',
    updatedBy: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }) as Vehicle;

const makeHistory = (overrides: Partial<VehicleStatusHistory> = {}): VehicleStatusHistory =>
  ({
    id: 1,
    vehicleId: 1,
    fromStatus: null,
    toStatus: 'disponivel',
    changedBy: 'aivacol',
    changedAt: new Date(),
    notes: null,
    ...overrides,
  }) as VehicleStatusHistory;

describe('VehiclesService', () => {
  let service: VehiclesService;
  let repo: jest.Mocked<Repository<Vehicle>>;
  let statusHistoryRepo: jest.Mocked<Repository<VehicleStatusHistory>>;
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let rabbitClient: { emit: jest.Mock };

  beforeEach(async () => {
    const mockRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockStatusHistoryRepo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
    rabbitClient = { emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: 'VEHICLE_REPOSITORY', useValue: mockRepo },
        { provide: 'VEHICLE_STATUS_HISTORY_REPOSITORY', useValue: mockStatusHistoryRepo },
        { provide: CACHE_MANAGER, useValue: cache },
        { provide: 'RABBITMQ_CLIENT', useValue: rabbitClient },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    repo = module.get('VEHICLE_REPOSITORY');
    statusHistoryRepo = module.get('VEHICLE_STATUS_HISTORY_REPOSITORY');
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

    it('queries the database on cache miss and stores the result', async () => {
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

    it('queries the database on cache miss and caches the result', async () => {
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

  describe('getStatusHistory', () => {
    it('returns the status history for a vehicle ordered by changedAt DESC', async () => {
      const vehicle = makeVehicle();
      const history = [
        makeHistory({ toStatus: 'alugado', fromStatus: 'disponivel' }),
        makeHistory({ toStatus: 'disponivel', fromStatus: null }),
      ];
      cache.get.mockResolvedValue(vehicle);
      statusHistoryRepo.find.mockResolvedValue(history);

      const result = await service.getStatusHistory('1');

      expect(statusHistoryRepo.find).toHaveBeenCalledWith({
        where: { vehicleId: 1 },
        order: { changedAt: 'DESC' },
      });
      expect(result).toEqual(history);
    });

    it('throws NotFoundException when the vehicle does not exist', async () => {
      cache.get.mockResolvedValue(null);
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.getStatusHistory('99')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('persists the vehicle, assigns createdBy, and records the initial status history', async () => {
      const payload = { licensePlate: 'DEF-5678', modelId: 1, year: 2023 };
      const vehicle = makeVehicle({ licensePlate: 'DEF-5678', createdBy: 'aivacol' });
      repo.create.mockReturnValue(vehicle);
      repo.save.mockResolvedValue(vehicle);
      statusHistoryRepo.create.mockReturnValue(makeHistory());
      statusHistoryRepo.save.mockResolvedValue(makeHistory());

      const result = await service.create(payload, 'aivacol');

      expect(repo.create).toHaveBeenCalledWith({ ...payload, createdBy: 'aivacol' });
      expect(statusHistoryRepo.save).toHaveBeenCalledTimes(1);
      expect(cache.del).toHaveBeenCalledWith('vehicles:all');
      expect(result).toEqual(vehicle);
    });

    it('emits a fleet.audit event after creating a vehicle', async () => {
      const vehicle = makeVehicle();
      repo.create.mockReturnValue(vehicle);
      repo.save.mockResolvedValue(vehicle);
      statusHistoryRepo.create.mockReturnValue(makeHistory());
      statusHistoryRepo.save.mockResolvedValue(makeHistory());

      await service.create({ licensePlate: 'ABC-1234', modelId: 1, year: 2022 }, 'aivacol');

      expect(rabbitClient.emit).toHaveBeenCalledWith(
        'fleet.audit',
        expect.objectContaining({ action: 'created', entity: 'vehicle' }),
      );
    });
  });

  describe('update', () => {
    it('updates the vehicle, sets updatedBy, and invalidates both cache keys', async () => {
      const vehicle = makeVehicle();
      const updated = makeVehicle({ year: 2023, updatedBy: 'aivacol' });
      cache.get
        .mockResolvedValueOnce(vehicle)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      repo.findOneBy.mockResolvedValue(updated);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.update('1', { year: 2023 }, 'aivacol');

      expect(repo.update).toHaveBeenCalledWith('1', { year: 2023, updatedBy: 'aivacol' });
      expect(cache.del).toHaveBeenCalledWith('vehicles:all');
      expect(cache.del).toHaveBeenCalledWith('vehicles:1');
    });

    it('emits a fleet.audit event after updating', async () => {
      const vehicle = makeVehicle();
      const updated = makeVehicle({ year: 2023, updatedBy: 'aivacol' });
      cache.get
        .mockResolvedValueOnce(vehicle)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      repo.findOneBy.mockResolvedValue(updated);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.update('1', { year: 2023 }, 'aivacol');

      expect(rabbitClient.emit).toHaveBeenCalledWith(
        'fleet.audit',
        expect.objectContaining({ action: 'updated', entity: 'vehicle', entityId: 1 }),
      );
    });

    it('throws NotFoundException when vehicle does not exist', async () => {
      cache.get.mockResolvedValue(null);
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.update('99', { year: 2023 }, 'aivacol')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('changeStatus', () => {
    it('transitions the vehicle to a new status and records it in history', async () => {
      const vehicle = makeVehicle({ status: 'disponivel' });
      const updated = makeVehicle({ status: 'alugado', updatedBy: 'aivacol' });

      cache.get
        .mockResolvedValueOnce(vehicle)   // first findOne (before update)
        .mockResolvedValueOnce(null)       // findOne cache miss after update
        .mockResolvedValueOnce(null);
      repo.findOneBy.mockResolvedValue(updated);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      statusHistoryRepo.create.mockReturnValue(makeHistory({ fromStatus: 'disponivel', toStatus: 'alugado' }));
      statusHistoryRepo.save.mockResolvedValue(makeHistory());

      const result = await service.changeStatus('1', 'alugado', 'aivacol');

      expect(repo.update).toHaveBeenCalledWith('1', { status: 'alugado', updatedBy: 'aivacol' });
      expect(statusHistoryRepo.save).toHaveBeenCalledTimes(1);
      expect(cache.del).toHaveBeenCalledWith('vehicles:all');
      expect(cache.del).toHaveBeenCalledWith('vehicles:1');
      expect(result).toEqual(updated);
    });

    it('throws BadRequestException when transitioning to the same status', async () => {
      const vehicle = makeVehicle({ status: 'disponivel' });
      cache.get.mockResolvedValue(vehicle);

      await expect(service.changeStatus('1', 'disponivel', 'aivacol')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('persists optional notes in the status history entry', async () => {
      const vehicle = makeVehicle({ status: 'disponivel' });
      const updated = makeVehicle({ status: 'manutencao', updatedBy: 'aivacol' });

      cache.get
        .mockResolvedValueOnce(vehicle)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      repo.findOneBy.mockResolvedValue(updated);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      statusHistoryRepo.create.mockReturnValue(makeHistory());
      statusHistoryRepo.save.mockResolvedValue(makeHistory());

      await service.changeStatus('1', 'manutencao', 'aivacol', 'Revisão preventiva');

      expect(statusHistoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ notes: 'Revisão preventiva', toStatus: 'manutencao' }),
      );
    });

    it('emits a fleet.audit event after a status change', async () => {
      const vehicle = makeVehicle({ status: 'disponivel' });
      const updated = makeVehicle({ status: 'alugado' });

      cache.get
        .mockResolvedValueOnce(vehicle)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      repo.findOneBy.mockResolvedValue(updated);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      statusHistoryRepo.create.mockReturnValue(makeHistory());
      statusHistoryRepo.save.mockResolvedValue(makeHistory());

      await service.changeStatus('1', 'alugado', 'aivacol');

      expect(rabbitClient.emit).toHaveBeenCalledWith(
        'fleet.audit',
        expect.objectContaining({ action: 'updated', entity: 'vehicle', entityId: 1 }),
      );
    });

    it('throws NotFoundException when vehicle does not exist', async () => {
      cache.get.mockResolvedValue(null);
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.changeStatus('99', 'alugado', 'aivacol')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes the vehicle, sets status to inativo, and invalidates cache', async () => {
      const vehicle = makeVehicle();
      cache.get.mockResolvedValue(vehicle);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      statusHistoryRepo.create.mockReturnValue(makeHistory({ toStatus: 'inativo' }));
      statusHistoryRepo.save.mockResolvedValue(makeHistory());

      const result = await service.remove('1', 'aivacol');

      expect(repo.update).toHaveBeenCalledWith('1', {
        active: false,
        status: 'inativo',
        updatedBy: 'aivacol',
      });
      expect(statusHistoryRepo.save).toHaveBeenCalledTimes(1);
      expect(cache.del).toHaveBeenCalledWith('vehicles:all');
      expect(cache.del).toHaveBeenCalledWith('vehicles:1');
      expect(result).toEqual({ status: 'ok', message: 'vehicle id: 1 has been deleted' });
    });

    it('emits a fleet.audit event after removing', async () => {
      const vehicle = makeVehicle();
      cache.get.mockResolvedValue(vehicle);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      statusHistoryRepo.create.mockReturnValue(makeHistory());
      statusHistoryRepo.save.mockResolvedValue(makeHistory());

      await service.remove('1', 'aivacol');

      expect(rabbitClient.emit).toHaveBeenCalledWith(
        'fleet.audit',
        expect.objectContaining({ action: 'deleted', entity: 'vehicle', entityId: 1 }),
      );
    });

    it('throws NotFoundException when vehicle does not exist', async () => {
      cache.get.mockResolvedValue(null);
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('99', 'aivacol')).rejects.toThrow(NotFoundException);
    });
  });
});
