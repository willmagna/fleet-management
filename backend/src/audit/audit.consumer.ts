import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AuditService } from './audit.service';
import type { AuditEvent } from '../common/interfaces/audit-event.interface';

@Controller()
export class AuditConsumer {
  constructor(private readonly auditService: AuditService) {}

  @EventPattern('fleet.audit')
  async handleAuditEvent(@Payload() data: AuditEvent): Promise<void> {
    await this.auditService.create(data);
  }
}
