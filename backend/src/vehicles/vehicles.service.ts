import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @Inject('VEHICLE_REPOSITORY')
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  findAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({ where: { active: true } });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOneBy({
      id: Number(id),
      active: true,
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  create(payload: Partial<Vehicle>): Promise<Vehicle> {
    const data = {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'aivacol',
    };
    const vehicle = this.vehicleRepository.create(data);
    return this.vehicleRepository.save(vehicle);
  }

  async update(id: string, payload: Partial<Vehicle>): Promise<Vehicle> {
    const data = {
      ...payload,
      updatedAt: new Date(),
      updatedBy: 'aivacol',
    };
    const vehicle = await this.findOne(id);
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    await this.vehicleRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<object> {
    await this.findOne(id);
    await this.vehicleRepository.update(id, {
      active: false,
      updatedBy: 'aivacol',
    });
    return {
      status: 'ok',
      message: `vehicle id: ${id} has been deleted`,
    };
  }
}
