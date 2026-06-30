import { DataSource } from 'typeorm';
import { Model } from './model.entity';

export const modelsProviders = [
  {
    provide: 'MODEL_REPOSITORY',
    inject: ['DATA_SOURCE'],
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Model),
  },
];
