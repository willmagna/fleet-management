import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ClientProxy } from '@nestjs/microservices';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { Model } from './model.entity';
import { AuditEvent } from '../common/interfaces/audit-event.interface';

const CACHE_KEY_ALL = 'models:all';
const cacheKeyOne = (id: string) => `models:${id}`;

@Injectable()
export class ModelsService {
  constructor(
    @Inject('MODEL_REPOSITORY')
    private readonly modelRepository: Repository<Model>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    @Inject('RABBITMQ_CLIENT')
    private readonly rabbitClient: ClientProxy,
  ) {}

  async findAll(): Promise<Model[]> {
    const cached = await this.cache.get<Model[]>(CACHE_KEY_ALL);
    if (cached) return cached;

    const models = await this.modelRepository.find({ where: { active: true } });
    await this.cache.set(CACHE_KEY_ALL, models);
    return models;
  }

  async findOne(id: string): Promise<Model> {
    const cached = await this.cache.get<Model>(cacheKeyOne(id));
    if (cached) return cached;

    const model = await this.modelRepository.findOneBy({
      id: Number(id),
      active: true,
    });
    if (!model) throw new NotFoundException(`Model ${id} not found`);

    await this.cache.set(cacheKeyOne(id), model);
    return model;
  }

  async create(payload: Partial<Model>, nickname: string): Promise<Model> {
    const model = this.modelRepository.create({ ...payload, createdBy: nickname });
    const saved = await this.modelRepository.save(model);

    await this.cache.del(CACHE_KEY_ALL);

    this.rabbitClient
      .emit<void, AuditEvent>('fleet.audit', {
        action: 'created',
        entity: 'model',
        entityId: saved.id,
        data: saved,
        performedBy: nickname,
        timestamp: new Date(),
      })
      .subscribe({ error: (err) => console.error('[Audit] emit failed', err) });

    return saved;
  }

  async update(id: string, payload: Partial<Model>, nickname: string): Promise<Model> {
    await this.findOne(id);
    await this.modelRepository.update(id, { ...payload, updatedBy: nickname });
    await this.cache.del(CACHE_KEY_ALL);
    await this.cache.del(cacheKeyOne(id));
    const updated = await this.findOne(id);

    this.rabbitClient
      .emit<void, AuditEvent>('fleet.audit', {
        action: 'updated',
        entity: 'model',
        entityId: Number(id),
        data: updated,
        performedBy: nickname,
        timestamp: new Date(),
      })
      .subscribe({ error: (err) => console.error('[Audit] emit failed', err) });

    return updated;
  }

  async remove(id: string, nickname: string): Promise<object> {
    await this.findOne(id);
    await this.modelRepository.update(id, { active: false, updatedBy: nickname });
    await this.cache.del(CACHE_KEY_ALL);
    await this.cache.del(cacheKeyOne(id));

    this.rabbitClient
      .emit<void, AuditEvent>('fleet.audit', {
        action: 'deleted',
        entity: 'model',
        entityId: Number(id),
        data: { id },
        performedBy: nickname,
        timestamp: new Date(),
      })
      .subscribe({ error: (err) => console.error('[Audit] emit failed', err) });

    return { status: 'ok', message: `model id: ${id} has been deleted` };
  }
}
