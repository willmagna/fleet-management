import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.modules';
import { vehiclesProviders } from './vehicles.providers';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';

@Module({
  imports: [DatabaseModule],
  providers: [...vehiclesProviders, VehiclesService],
  controllers: [VehiclesController],
  exports: [VehiclesService],
})
export class VehiclesModule {}
