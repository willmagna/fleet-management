import { ConfigService } from '@nestjs/config';
import dataSource from './data-source';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    inject: [ConfigService],
    useFactory: async () => {
      return dataSource.initialize();
    },
  },
];
