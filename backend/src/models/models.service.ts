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

  create(payload: Partial<Model>, nickname: string): Promise<Model> {
    const model = this.modelRepository.create({
      ...payload,
      createdBy: nickname,
    });
    return this.modelRepository.save(model);
  }

  async update(
    id: string,
    payload: Partial<Model>,
    nickname: string,
  ): Promise<Model> {
    await this.findOne(id);
    await this.modelRepository.update(id, {
      ...payload,
      updatedBy: nickname,
    });
    return this.findOne(id);
  }

  async remove(id: string, nickname: string): Promise<object> {
    await this.findOne(id);
    await this.modelRepository.update(id, {
      active: false,
      updatedBy: nickname,
    });
    return { status: 'ok', message: `model id: ${id} has been deleted` };
  }
}
