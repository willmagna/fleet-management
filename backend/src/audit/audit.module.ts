import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoModule } from '../mongo/mongo.module';
import { AuditLog, AuditSchema } from './audit.schema';
import { AuditService } from './audit.service';
import { AuditConsumer } from './audit.consumer';

@Module({
  imports: [
    MongoModule,
    MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditSchema }]),
  ],
  providers: [AuditService],
  controllers: [AuditConsumer],
})
export class AuditModule {}
