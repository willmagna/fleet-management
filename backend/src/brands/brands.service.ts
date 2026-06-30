import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { Brand } from './brand.entity';
import { AuditEvent } from '../common/interfaces/audit-event.interface';

@Injectable()
export class BrandsService {
  constructor(
    @Inject('BRAND_REPOSITORY')
    private readonly brandRepository: Repository<Brand>,
    @Inject('RABBITMQ_CLIENT')
    private readonly rabbitClient: ClientProxy,
  ) {}

  findAll(): Promise<Brand[]> {
    return this.brandRepository.find({ where: { active: true } });
  }

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findOneBy({
      id: Number(id),
      active: true,
    });
    if (!brand) throw new NotFoundException(`Brand ${id} not found`);
    return brand;
  }

  async create(payload: Partial<Brand>, nickname: string): Promise<Brand> {
    const brand = this.brandRepository.create({ ...payload, createdBy: nickname });
    const saved = await this.brandRepository.save(brand);

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
