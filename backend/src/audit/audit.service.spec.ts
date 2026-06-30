import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { AuditLog } from './audit.schema';
import { AuditEvent } from '../common/interfaces/audit-event.interface';

const makeEvent = (overrides: Partial<AuditEvent> = {}): AuditEvent => ({
  action: 'created',
  entity: 'vehicle',
  entityId: 1,
  data: { id: 1 },
  performedBy: 'aivacol',
  timestamp: new Date('2024-01-01'),
  ...overrides,
});

describe('AuditService', () => {
  let service: AuditService;
  let auditModel: { create: jest.Mock };

  beforeEach(async () => {
    auditModel = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getModelToken(AuditLog.name), useValue: auditModel },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('persists the audit event to MongoDB', async () => {
    const event = makeEvent();
    auditModel.create.mockResolvedValue(event);

    await service.create(event);

    expect(auditModel.create).toHaveBeenCalledWith(event);
  });

  it('persists events for all valid action types', async () => {
    const actions: AuditEvent['action'][] = ['created', 'updated', 'deleted'];

    for (const action of actions) {
      auditModel.create.mockResolvedValue(undefined);
      await service.create(makeEvent({ action }));
      expect(auditModel.create).toHaveBeenCalledWith(expect.objectContaining({ action }));
    }
  });

  it('persists events for all valid entity types', async () => {
    const entities: AuditEvent['entity'][] = ['brand', 'model', 'vehicle'];

    for (const entity of entities) {
      auditModel.create.mockResolvedValue(undefined);
      await service.create(makeEvent({ entity }));
      expect(auditModel.create).toHaveBeenCalledWith(expect.objectContaining({ entity }));
    }
  });
});
