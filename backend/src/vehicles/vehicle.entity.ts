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
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
  modelId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by' })
  createdBy!: string;
}
