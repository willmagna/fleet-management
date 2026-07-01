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
import { BrandsService } from './brands.service';
import { Brand } from './brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@ApiTags('brands')
@ApiBearerAuth('access-token')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active brands' })
  findAll(): Promise<Brand[]> {
    return this.brandsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a brand by ID' })
  findOne(@Param('id') id: string): Promise<Brand> {
    return this.brandsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new brand' })
  create(
    @Body() body: CreateBrandDto,
    @Request() req: { user: { nickname: string } },
  ): Promise<Brand> {
    return this.brandsService.create(body, req.user.nickname);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a brand' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateBrandDto,
    @Request() req: { user: { nickname: string } },
  ): Promise<Brand> {
    return this.brandsService.update(id, body, req.user.nickname);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a brand (sets active = false)' })
  remove(
    @Param('id') id: string,
    @Request() req: { user: { nickname: string } },
  ): Promise<object> {
    return this.brandsService.remove(id, req.user.nickname);
  }
}
