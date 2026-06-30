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
import { BrandsService } from './brands.service';
import { Brand } from './brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

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
  create(
    @Body() body: CreateBrandDto,
    @Request() req: { user: { nickname: string } },
  ): Promise<Brand> {
    return this.brandsService.create(body, req.user.nickname);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateBrandDto,
    @Request() req: { user: { nickname: string } },
  ): Promise<Brand> {
    return this.brandsService.update(id, body, req.user.nickname);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() req: { user: { nickname: string } },
  ): Promise<object> {
    return this.brandsService.remove(id, req.user.nickname);
  }
}
