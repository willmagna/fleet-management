import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
} from '@nestjs/common';
import { ModelsService } from './models.service';
import { Model } from './model.entity';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';

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
  create(
    @Body() body: CreateModelDto,
    @Request() req: { user: { nickname: string } },
  ): Promise<Model> {
    return this.modelsService.create(body, req.user.nickname);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateModelDto,
    @Request() req: { user: { nickname: string } },
  ): Promise<Model> {
    return this.modelsService.update(id, body, req.user.nickname);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() req: { user: { nickname: string } },
  ): Promise<object> {
    return this.modelsService.remove(id, req.user.nickname);
  }
}
