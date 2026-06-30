import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Model } from './model.entity';

@Injectable()
export class ModelsService {
  constructor(
    @Inject('MODEL_REPOSITORY')
    private readonly modelRepository: Repository<Model>,
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

  create(payload: Partial<Model>): Promise<Model> {
    const data = {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'aivacol',
    };
    console.log(data);
    const model = this.modelRepository.create(data);
    return this.modelRepository.save(model);
  }

  async update(id: string, payload: Partial<Model>): Promise<Model> {
    const data = {
      ...payload,
      updatedAt: new Date(),
      updatedBy: 'aivacol',
    };
    const model = await this.findOne(id);
    if (!model) throw new NotFoundException(`Model ${id} not found`);
    await this.modelRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<object> {
    await this.findOne(id);
    await this.modelRepository.update(id, {
      active: false,
      updatedBy: 'aivacol',
    });
    return {
      status: 'ok',
      message: `model id: ${id} has been deleted`,
    };
  }
}
