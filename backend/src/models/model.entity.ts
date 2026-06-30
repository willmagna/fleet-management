import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Brand } from '../brands/brand.entity';

@Entity('models')
export class Model {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => Brand, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'brand_id' })
  brand!: Brand;

  @Column({ name: 'brand_id' })
  brandId!: number;

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
