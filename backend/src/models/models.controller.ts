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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ModelsService } from './models.service';
import { Model } from './model.entity';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';

@ApiTags('models')
@ApiBearerAuth('access-token')
@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active models' })
  findAll(): Promise<Model[]> {
    return this.modelsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a model by ID' })
  findOne(@Param('id') id: string): Promise<Model> {
    return this.modelsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new model' })
  create(
    @Body() body: CreateModelDto,
    @Request() req: { user: { nickname: string } },
  ): Promise<Model> {
    return this.modelsService.create(body, req.user.nickname);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a model' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateModelDto,
    @Request() req: { user: { nickname: string } },
  ): Promise<Model> {
    return this.modelsService.update(id, body, req.user.nickname);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a model (sets active = false)' })
  remove(
    @Param('id') id: string,
    @Request() req: { user: { nickname: string } },
  ): Promise<object> {
    return this.modelsService.remove(id, req.user.nickname);
  }
}
