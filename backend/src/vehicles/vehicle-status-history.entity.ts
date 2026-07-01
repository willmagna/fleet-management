import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('vehicle_status_history')
export class VehicleStatusHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'vehicle_id' })
  vehicleId!: number;

  @Column({ name: 'from_status', type: 'nvarchar', nullable: true })
  fromStatus!: string | null;

  @Column({ name: 'to_status', type: 'nvarchar' })
  toStatus!: string;

  @Column({ name: 'changed_by' })
  changedBy!: string;

  @Column({ name: 'changed_at' })
  changedAt!: Date;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  notes!: string | null;
}
