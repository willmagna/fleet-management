import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';

const CACHE_KEY_ALL = 'vehicles:all';
const cacheKeyOne = (id: string) => `vehicles:${id}`;

@Injectable()
export class VehiclesService {
  constructor(
    @Inject('VEHICLE_REPOSITORY')
    private readonly vehicleRepository: Repository<Vehicle>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async findAll(): Promise<Vehicle[]> {
    const cached = await this.cache.get<Vehicle[]>(CACHE_KEY_ALL);
    if (cached) return cached;

    const vehicles = await this.vehicleRepository.find({
      where: { active: true },
    });
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

  async create(payload: Partial<Vehicle>, nickname: string): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create({
      ...payload,
      createdBy: nickname,
    });
    const saved = await this.vehicleRepository.save(vehicle);
    await this.cache.del(CACHE_KEY_ALL);
    return saved;
  }

  async update(
    id: string,
    payload: Partial<Vehicle>,
    nickname: string,
  ): Promise<Vehicle> {
    await this.findOne(id);
    await this.vehicleRepository.update(id, {
      ...payload,
      updatedBy: nickname,
    });
    await this.cache.del(CACHE_KEY_ALL);
    await this.cache.del(cacheKeyOne(id));
    return this.findOne(id);
  }

  async remove(id: string, nickname: string): Promise<object> {
    await this.findOne(id);
    await this.vehicleRepository.update(id, {
      active: false,
      updatedBy: nickname,
    });
    await this.cache.del(CACHE_KEY_ALL);
    await this.cache.del(cacheKeyOne(id));
    return { status: 'ok', message: `vehicle id: ${id} has been deleted` };
  }
}
