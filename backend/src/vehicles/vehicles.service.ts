import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ClientProxy } from '@nestjs/microservices';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { VehicleStatusHistory } from './vehicle-status-history.entity';
import type { AuditEvent } from '../common/interfaces/audit-event.interface';

const CACHE_KEY_ALL = 'vehicles:all';
const cacheKeyOne = (id: string) => `vehicles:${id}`;

@Injectable()
export class VehiclesService {
  constructor(
    @Inject('VEHICLE_REPOSITORY')
    private readonly vehicleRepository: Repository<Vehicle>,
    @Inject('VEHICLE_STATUS_HISTORY_REPOSITORY')
    private readonly statusHistoryRepository: Repository<VehicleStatusHistory>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    @Inject('RABBITMQ_CLIENT')
    private readonly rabbitClient: ClientProxy,
  ) {}

  async findAll(): Promise<Vehicle[]> {
    const cached = await this.cache.get<Vehicle[]>(CACHE_KEY_ALL);
    if (cached) return cached;

    const vehicles = await this.vehicleRepository.find({ where: { active: true } });
    await this.cache.set(CACHE_KEY_ALL, vehicles);
    return vehicles;
  }

  async findOne(id: string): Promise<Vehicle> {
    const cached = await this.cache.get<Vehicle>(cacheKeyOne(id));
    if (cached) return cached;

    const vehicle = await this.vehicleRepository.findOneBy({
      id: Number(id),
      active: true,
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);

    await this.cache.set(cacheKeyOne(id), vehicle);
    return vehicle;
  }

  async getStatusHistory(id: string): Promise<VehicleStatusHistory[]> {
    await this.findOne(id);
    return this.statusHistoryRepository.find({
      where: { vehicleId: Number(id) },
      order: { changedAt: 'DESC' },
    });
  }

  async create(payload: Partial<Vehicle>, nickname: string): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create({ ...payload, createdBy: nickname });
    const saved = await this.vehicleRepository.save(vehicle);

    await this.statusHistoryRepository.save(
      this.statusHistoryRepository.create({
        vehicleId: saved.id,
        fromStatus: null,
        toStatus: 'disponivel',
        changedBy: nickname,
        changedAt: new Date(),
        notes: null,
      }),
    );

    await this.cache.del(CACHE_KEY_ALL);

    this.rabbitClient
      .emit<void, AuditEvent>('fleet.audit', {
        action: 'created',
        entity: 'vehicle',
        entityId: saved.id,
        data: saved,
        performedBy: nickname,
        timestamp: new Date(),
      })
      .subscribe({ error: (err) => console.error('[Audit] emit failed', err) });

    return saved;
  }

  async update(id: string, payload: Partial<Vehicle>, nickname: string): Promise<Vehicle> {
    await this.findOne(id);
    await this.vehicleRepository.update(id, { ...payload, updatedBy: nickname });
    await this.cache.del(CACHE_KEY_ALL);
    await this.cache.del(cacheKeyOne(id));
    const updated = await this.findOne(id);

    this.rabbitClient
      .emit<void, AuditEvent>('fleet.audit', {
        action: 'updated',
        entity: 'vehicle',
        entityId: Number(id),
        data: updated,
        performedBy: nickname,
        timestamp: new Date(),
      })
      .subscribe({ error: (err) => console.error('[Audit] emit failed', err) });

    return updated;
  }

  async changeStatus(
    id: string,
    newStatus: string,
    nickname: string,
    notes?: string,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (vehicle.status === newStatus) {
      throw new BadRequestException(`Vehicle is already in status '${newStatus}'`);
    }

    const fromStatus = vehicle.status;
    await this.vehicleRepository.update(id, { status: newStatus, updatedBy: nickname });

    await this.statusHistoryRepository.save(
      this.statusHistoryRepository.create({
        vehicleId: Number(id),
        fromStatus,
        toStatus: newStatus,
        changedBy: nickname,
        changedAt: new Date(),
        notes: notes ?? null,
      }),
    );

    await this.cache.del(CACHE_KEY_ALL);
    await this.cache.del(cacheKeyOne(id));

    const updated = await this.findOne(id);

    this.rabbitClient
      .emit<void, AuditEvent>('fleet.audit', {
        action: 'updated',
        entity: 'vehicle',
        entityId: Number(id),
        data: { status: newStatus, fromStatus, notes },
        performedBy: nickname,
        timestamp: new Date(),
      })
      .subscribe({ error: (err) => console.error('[Audit] emit failed', err) });

    return updated;
  }

  async remove(id: string, nickname: string): Promise<object> {
    const vehicle = await this.findOne(id);
    const fromStatus = vehicle.status;

    await this.vehicleRepository.update(id, {
      active: false,
      status: 'inativo',
      updatedBy: nickname,
    });

    await this.statusHistoryRepository.save(
      this.statusHistoryRepository.create({
        vehicleId: Number(id),
        fromStatus,
        toStatus: 'inativo',
        changedBy: nickname,
        changedAt: new Date(),
        notes: null,
      }),
    );

    await this.cache.del(CACHE_KEY_ALL);
    await this.cache.del(cacheKeyOne(id));

    this.rabbitClient
      .emit<void, AuditEvent>('fleet.audit', {
        action: 'deleted',
        entity: 'vehicle',
        entityId: Number(id),
        data: { id },
        performedBy: nickname,
        timestamp: new Date(),
      })
      .subscribe({ error: (err) => console.error('[Audit] emit failed', err) });

    return { status: 'ok', message: `vehicle id: ${id} has been deleted` };
  }
}
