import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { Brand } from './brand.entity';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  findAll(): Promise<Brand[]> {
    return this.brandsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Brand> {
    return this.brandsService.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<Brand>): Promise<Brand> {
    return this.brandsService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<Brand>,
  ): Promise<Brand> {
    return this.brandsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<object> {
    return this.brandsService.remove(id);
  }
}
