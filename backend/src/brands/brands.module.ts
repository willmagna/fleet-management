import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.modules';
import { MessagingModule } from '../messaging/messaging.module';
import { brandsProviders } from './brands.providers';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';

@Module({
  imports: [DatabaseModule, MessagingModule],
  providers: [...brandsProviders, BrandsService],
  controllers: [BrandsController],
  exports: [BrandsService],
})
export class BrandsModule {}
