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
    return this.modelRepository.find();
  }

  async findOne(id: string): Promise<Model> {
    const model = await this.modelRepository.findOneBy({ id });
    if (!model) throw new NotFoundException(`Model ${id} not found`);
    return model;
  }

  create(data: Partial<Model>): Promise<Model> {
    const model = this.modelRepository.create(data);
    return this.modelRepository.save(model);
  }

  async update(id: string, data: Partial<Model>): Promise<Model> {
    await this.findOne(id);
    await this.modelRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.modelRepository.delete(id);
  }
}
