import { Test, TestingModule } from '@nestjs/testing';
import { AuditConsumer } from './audit.consumer';
import { AuditService } from './audit.service';
import { AuditEvent } from '../common/interfaces/audit-event.interface';

describe('AuditConsumer', () => {
  let consumer: AuditConsumer;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    auditService = { create: jest.fn() } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditConsumer],
      providers: [{ provide: AuditService, useValue: auditService }],
    }).compile();

    consumer = module.get<AuditConsumer>(AuditConsumer);
  });

  it('delegates the incoming fleet.audit event to AuditService.create', async () => {
    const event: AuditEvent = {
      action: 'created',
      entity: 'vehicle',
      entityId: 1,
      data: { id: 1 },
      performedBy: 'aivacol',
      timestamp: new Date(),
    };

    await consumer.handleAuditEvent(event);

    expect(auditService.create).toHaveBeenCalledWith(event);
  });

  it('handles all action types without throwing', async () => {
    const actions: AuditEvent['action'][] = ['created', 'updated', 'deleted'];

    for (const action of actions) {
      auditService.create.mockResolvedValue(undefined);
      await expect(
        consumer.handleAuditEvent({
          action,
          entity: 'brand',
          entityId: 1,
          data: {},
          performedBy: 'aivacol',
          timestamp: new Date(),
        }),
      ).resolves.not.toThrow();
    }
  });
});
