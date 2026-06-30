import { DataSource } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { VehicleStatusHistory } from './vehicle-status-history.entity';

export const vehiclesProviders = [
  {
    provide: 'VEHICLE_REPOSITORY',
    inject: ['DATA_SOURCE'],
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Vehicle),
  },
  {
    provide: 'VEHICLE_STATUS_HISTORY_REPOSITORY',
    inject: ['DATA_SOURCE'],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(VehicleStatusHistory),
  },
];
