import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Model } from './model.entity';
import { ModelsService } from './models.service';

const makeModel = (overrides: Partial<Model> = {}): Model =>
  ({
    id: 1,
    name: 'Corolla',
    brandId: 1,
    active: true,
    createdBy: 'aivacol',
    updatedBy: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }) as Model;

const mockRabbitClient = () => ({
  emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
});

describe('ModelsService', () => {
  let service: ModelsService;
  let repo: jest.Mocked<Repository<Model>>;
  let rabbitClient: ReturnType<typeof mockRabbitClient>;

  beforeEach(async () => {
    const mockRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    rabbitClient = mockRabbitClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelsService,
        { provide: 'MODEL_REPOSITORY', useValue: mockRepo },
        { provide: 'RABBITMQ_CLIENT', useValue: rabbitClient },
      ],
    }).compile();

    service = module.get<ModelsService>(ModelsService);
    repo = module.get('MODEL_REPOSITORY');
  });

  describe('findAll', () => {
    it('returns only active models', async () => {
      const models = [makeModel()];
      repo.find.mockResolvedValue(models);

      const result = await service.findAll();

      expect(result).toEqual(models);
      expect(repo.find).toHaveBeenCalledWith({ where: { active: true } });
    });

    it('returns empty array when no active models exist', async () => {
      repo.find.mockResolvedValue([]);

      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns the model when found and active', async () => {
      const model = makeModel();
      repo.findOneBy.mockResolvedValue(model);

      const result = await service.findOne('1');

      expect(result).toEqual(model);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1, active: true });
    });

    it('throws NotFoundException when model does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('99')).rejects.toThrow(NotFoundException);
    });

    it('does not return inactive (soft-deleted) models', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1, active: true });
    });
  });

  describe('create', () => {
    it('creates model associated with a brand and assigns createdBy', async () => {
      const payload = { name: 'Corolla', brandId: 1 };
      const model = makeModel({ name: 'Corolla', brandId: 1, createdBy: 'aivacol' });
      repo.create.mockReturnValue(model);
      repo.save.mockResolvedValue(model);

      const result = await service.create(payload, 'aivacol');

      expect(repo.create).toHaveBeenCalledWith({ ...payload, createdBy: 'aivacol' });
      expect(result).toEqual(model);
    });

    it('emits a fleet.audit event after creating a model', async () => {
      const model = makeModel();
      repo.create.mockReturnValue(model);
      repo.save.mockResolvedValue(model);

      await service.create({ name: 'Corolla', brandId: 1 }, 'aivacol');

      expect(rabbitClient.emit).toHaveBeenCalledWith(
        'fleet.audit',
        expect.objectContaining({ action: 'created', entity: 'model', entityId: model.id }),
      );
    });
  });

  describe('update', () => {
    it('updates existing model and sets updatedBy', async () => {
      const model = makeModel();
      const updated = makeModel({ name: 'Corolla Updated', updatedBy: 'aivacol' });
      repo.findOneBy
        .mockResolvedValueOnce(model)
        .mockResolvedValueOnce(updated);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      const result = await service.update('1', { name: 'Corolla Updated' }, 'aivacol');

      expect(repo.update).toHaveBeenCalledWith('1', {
        name: 'Corolla Updated',
        updatedBy: 'aivacol',
      });
      expect(result).toEqual(updated);
    });

    it('emits a fleet.audit event after updating a model', async () => {
      const model = makeModel();
      const updated = makeModel({ updatedBy: 'aivacol' });
      repo.findOneBy.mockResolvedValueOnce(model).mockResolvedValueOnce(updated);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.update('1', { name: 'Corolla Updated' }, 'aivacol');

      expect(rabbitClient.emit).toHaveBeenCalledWith(
        'fleet.audit',
        expect.objectContaining({ action: 'updated', entity: 'model', entityId: 1 }),
      );
    });

    it('throws NotFoundException when model does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.update('99', { name: 'X' }, 'aivacol')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes by setting active=false and recording updatedBy', async () => {
      const model = makeModel();
      repo.findOneBy.mockResolvedValue(model);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      const result = await service.remove('1', 'aivacol');

      expect(repo.update).toHaveBeenCalledWith('1', {
        active: false,
        updatedBy: 'aivacol',
      });
      expect(result).toEqual({ status: 'ok', message: 'model id: 1 has been deleted' });
    });

    it('emits a fleet.audit event after removing a model', async () => {
      const model = makeModel();
      repo.findOneBy.mockResolvedValue(model);
      repo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.remove('1', 'aivacol');

      expect(rabbitClient.emit).toHaveBeenCalledWith(
        'fleet.audit',
        expect.objectContaining({ action: 'deleted', entity: 'model', entityId: 1 }),
      );
    });

    it('throws NotFoundException when model does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('99', 'aivacol')).rejects.toThrow(NotFoundException);
    });
  });
});
