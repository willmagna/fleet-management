import { DataSource } from 'typeorm';
import { Brand } from './brand.entity';

export const brandsProviders = [
  {
    provide: 'BRAND_REPOSITORY',
    inject: ['DATA_SOURCE'],
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Brand),
  },
];
