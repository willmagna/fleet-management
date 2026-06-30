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
    if (!brand) throw new NotFoundException(`Brand ${id} not found`);
    return brand;
  }

  create(payload: Partial<Brand>, nickname: string): Promise<Brand> {
    const brand = this.brandRepository.create({
      ...payload,
      createdBy: nickname,
    });
    return this.brandRepository.save(brand);
  }

  async update(
    id: string,
    payload: Partial<Brand>,
    nickname: string,
  ): Promise<Brand> {
    await this.findOne(id);
    await this.brandRepository.update(id, {
      ...payload,
      updatedBy: nickname,
    });
    return this.findOne(id);
  }

  async remove(id: string, nickname: string): Promise<object> {
    await this.findOne(id);
    await this.brandRepository.update(id, {
      active: false,
      updatedBy: nickname,
    });
    return { status: 'ok', message: `brand id: ${id} has been deleted` };
  }
}
