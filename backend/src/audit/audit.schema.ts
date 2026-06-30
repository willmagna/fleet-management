import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditDocument = AuditLog & Document;

@Schema({ collection: 'audit_logs', timestamps: false })
export class AuditLog {
  @Prop({ required: true, enum: ['created', 'updated', 'deleted'] })
  action: string;

  @Prop({ required: true, enum: ['brand', 'model', 'vehicle'] })
  entity: string;

  @Prop({ required: true })
  entityId: number;

  @Prop({ type: Object, required: true })
  data: object;

  @Prop({ required: true })
  performedBy: string;

  @Prop({ required: true })
  timestamp: Date;
}

export const AuditSchema = SchemaFactory.createForClass(AuditLog);
