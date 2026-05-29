import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { MaterialStatus } from '../common/enums/material.enum';
import { Project } from './project.entity';
import { Supplier } from './supplier.entity';
import { StatusLog } from './status-log.entity';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  materialNo: string;

  @Column()
  version: number;

  @ManyToOne(() => Project, (project) => project.materials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @Column({ nullable: true })
  supplierId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  specification: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: MaterialStatus,
    default: MaterialStatus.DRAFT,
  })
  status: MaterialStatus;

  @Column({ type: 'timestamp', nullable: true })
  expectedDeliveryDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualDeliveryDate: Date;

  @Column({ nullable: true })
  receiver: string;

  @Column({ type: 'jsonb', nullable: true })
  attachmentFiles: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  reviewRemark: string;

  @Column({ nullable: true })
  reviewer: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => StatusLog, (log) => log.material)
  statusLogs: StatusLog[];
}
