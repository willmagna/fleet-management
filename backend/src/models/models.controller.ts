import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ModelsService } from './models.service';
import { Model } from './model.entity';

@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  findAll(): Promise<Model[]> {
    return this.modelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Model> {
    return this.modelsService.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<Model>): Promise<Model> {
    return this.modelsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Model>): Promise<Model> {
    return this.modelsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.modelsService.remove(id);
  }
}
