import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditDocument } from './audit.schema';
import { AuditEvent } from '../common/interfaces/audit-event.interface';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditDocument>,
  ) {}

  async create(event: AuditEvent): Promise<void> {
    await this.auditModel.create(event);
  }
}
