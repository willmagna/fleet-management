import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Brand } from './brand.entity';

@Injectable()
export class BrandsService {
  constructor(
    @Inject('BRAND_REPOSITORY')
    private readonly brandRepository: Repository<Brand>,
  ) {}

  findAll(): Promise<Brand[]> {
    return this.brandRepository.find({ where: { active: true } });
  }

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findOneBy({
      id: Number(id),
      active: true,
    });
    console.log(brand);
    if (!brand) throw new NotFoundException(`Brand ${id} not found`);
    return brand;
  }

  create(payload: Partial<Brand>): Promise<Brand> {
    const data = {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'aivacol',
    };
    const brand = this.brandRepository.create(data);
    return this.brandRepository.save(brand);
  }

  async update(id: string, payload: Partial<Brand>): Promise<Brand> {
    const data = {
      ...payload,
      updatedAt: new Date(),
      updatedBy: 'aivacol',
    };
    const brand = await this.findOne(id);
    if (!brand) throw new NotFoundException(`Brand ${id} not found`);
    await this.brandRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<object> {
    await this.findOne(id);
    const data = {
      active: false,
      updatedBy: 'aivacol',
    };
    await this.brandRepository.update(id, data);
    return {
      status: 'ok',
      message: `brand id: ${id} has been deleted`,
    };
  }
}
