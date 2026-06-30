import { Module } from '@nestjs/common';
import { messagingProviders } from './messaging.providers';

@Module({
  providers: [...messagingProviders],
  exports: [...messagingProviders],
})
export class MessagingModule {}
