export interface AuditEvent {
  action: 'created' | 'updated' | 'deleted';
  entity: 'brand' | 'model' | 'vehicle';
  entityId: number;
  data: object;
  performedBy: string;
  timestamp: Date;
}
