import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { Model } from './model.entity';
import { AuditEvent } from '../common/interfaces/audit-event.interface';

@Injectable()
export class ModelsService {
  constructor(
    @Inject('MODEL_REPOSITORY')
    private readonly modelRepository: Repository<Model>,
    @Inject('RABBITMQ_CLIENT')
    private readonly rabbitClient: ClientProxy,
  ) {}

  findAll(): Promise<Model[]> {
    return this.modelRepository.find({ where: { active: true } });
  }

  async findOne(id: string): Promise<Model> {
    const model = await this.modelRepository.findOneBy({
      id: Number(id),
      active: true,
    });
    if (!model) throw new NotFoundException(`Model ${id} not found`);
    return model;
  }

  async create(payload: Partial<Model>, nickname: string): Promise<Model> {
    const model = this.modelRepository.create({ ...payload, createdBy: nickname });
    const saved = await this.modelRepository.save(model);

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
