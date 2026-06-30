import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Model } from '../models/model.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'license_plate', unique: true })
  licensePlate!: string;

  @Column({ unique: true })
  chassis!: string;

  @Column({ unique: true })
  renavam!: string;

  @Column()
  year!: number;

  @ManyToOne(() => Model, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'model_id' })
  model!: Model;

  @Column({ name: 'model_id' })
  modelId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by' })
  createdBy!: string;

  @Column({ name: 'updated_by', type: 'varchar', nullable: true })
  updatedBy!: string | null;

  @Column({ default: true })
  active!: boolean;
}
