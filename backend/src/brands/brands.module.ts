import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.modules';
import { brandsProviders } from './brands.providers';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';

@Module({
  imports: [DatabaseModule],
  providers: [...brandsProviders, BrandsService],
  controllers: [BrandsController],
  exports: [BrandsService],
})
export class BrandsModule {}
