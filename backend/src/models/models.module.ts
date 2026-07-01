import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.modules';
import { MessagingModule } from '../messaging/messaging.module';
import { modelsProviders } from './models.providers';
import { ModelsService } from './models.service';
import { ModelsController } from './models.controller';

@Module({
  imports: [DatabaseModule, MessagingModule],
  providers: [...modelsProviders, ModelsService],
  controllers: [ModelsController],
  exports: [ModelsService],
})
export class ModelsModule {}
