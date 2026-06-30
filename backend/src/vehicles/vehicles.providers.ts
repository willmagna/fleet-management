import { DataSource } from 'typeorm';
import { Vehicle } from './vehicle.entity';

export const vehiclesProviders = [
  {
    provide: 'VEHICLE_REPOSITORY',
    inject: ['DATA_SOURCE'],
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Vehicle),
  },
];
