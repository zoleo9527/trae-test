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
import { SettlementStatus } from '../common/enums/settlement.enum';
import { Project } from './project.entity';
import { Supplier } from './supplier.entity';
import { StatusLog } from './status-log.entity';

@Entity('settlements')
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  settlementNo: string;

  @ManyToOne(() => Project, (project) => project.settlements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @Column({ nullable: true })
  supplierId: string;

  @Column({
    type: 'enum',
    enum: SettlementStatus,
    default: SettlementStatus.DRAFT,
  })
  status: SettlementStatus;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  contractAmount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  confirmedAmount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  auditAmount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  actualPaidAmount: number;

  @Column({ type: 'text', nullable: true })
  settlementItems: string;

  @Column({ type: 'jsonb', nullable: true })
  attachmentFiles: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  supplierRemark: string;

  @Column({ type: 'timestamp', nullable: true })
  supplierConfirmedAt: Date;

  @Column({ type: 'text', nullable: true })
  auditRemark: string;

  @Column({ nullable: true })
  auditor: string;

  @Column({ type: 'timestamp', nullable: true })
  auditedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expectedPaymentDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualPaymentDate: Date;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => StatusLog, (log) => log.settlement)
  statusLogs: StatusLog[];
}
