import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ClientProxy } from '@nestjs/microservices';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { Brand } from './brand.entity';
import { AuditEvent } from '../common/interfaces/audit-event.interface';

const CACHE_KEY_ALL = 'brands:all';
const cacheKeyOne = (id: string) => `brands:${id}`;

@Injectable()
export class BrandsService {
  constructor(
    @Inject('BRAND_REPOSITORY')
    private readonly brandRepository: Repository<Brand>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    @Inject('RABBITMQ_CLIENT')
    private readonly rabbitClient: ClientProxy,
  ) {}

  async findAll(): Promise<Brand[]> {
    const cached = await this.cache.get<Brand[]>(CACHE_KEY_ALL);
    if (cached) return cached;

    const brands = await this.brandRepository.find({ where: { active: true } });
    await this.cache.set(CACHE_KEY_ALL, brands);
    return brands;
  }

  async findOne(id: string): Promise<Brand> {
    const cached = await this.cache.get<Brand>(cacheKeyOne(id));
    if (cached) return cached;

    const brand = await this.brandRepository.findOneBy({
      id: Number(id),
      active: true,
    });
    if (!brand) throw new NotFoundException(`Brand ${id} not found`);

    await this.cache.set(cacheKeyOne(id), brand);
    return brand;
  }

  async create(payload: Partial<Brand>, nickname: string): Promise<Brand> {
    const brand = this.brandRepository.create({ ...payload, createdBy: nickname });
    const saved = await this.brandRepository.save(brand);

    await this.cache.del(CACHE_KEY_ALL);

    this.rabbitClient
      .emit<void, AuditEvent>('fleet.audit', {
        action: 'created',
        entity: 'brand',
        entityId: saved.id,
        data: saved,
        performedBy: nickname,
        timestamp: new Date(),
      })
      .subscribe({ error: (err) => console.error('[Audit] emit failed', err) });

    return saved;
  }

  async update(id: string, payload: Partial<Brand>, nickname: string): Promise<Brand> {
    await this.findOne(id);
    await this.brandRepository.update(id, { ...payload, updatedBy: nickname });
    await this.cache.del(CACHE_KEY_ALL);
    await this.cache.del(cacheKeyOne(id));
    const updated = await this.findOne(id);

    this.rabbitClient
      .emit<void, AuditEvent>('fleet.audit', {
        action: 'updated',
        entity: 'brand',
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
    await this.brandRepository.update(id, { active: false, updatedBy: nickname });
    await this.cache.del(CACHE_KEY_ALL);
    await this.cache.del(cacheKeyOne(id));

    this.rabbitClient
      .emit<void, AuditEvent>('fleet.audit', {
        action: 'deleted',
        entity: 'brand',
        entityId: Number(id),
        data: { id },
        performedBy: nickname,
        timestamp: new Date(),
      })
      .subscribe({ error: (err) => console.error('[Audit] emit failed', err) });

    return { status: 'ok', message: `brand id: ${id} has been deleted` };
  }
}
