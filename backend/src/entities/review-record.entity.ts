import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { User } from './user.entity';

export enum ReviewLevel {
  MINOR = 'minor',
  MAJOR = 'major',
  CRITICAL = 'critical',
}

@Entity('review_records')
export class ReviewRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column()
  workOrderId: string;

  @Column({
    type: 'enum',
    enum: ReviewLevel,
    default: ReviewLevel.MINOR,
  })
  level: ReviewLevel;

  @Column({ type: 'text', nullable: true })
  rootCause: string;

  @Column({ type: 'text', nullable: true })
  repairProcess: string;

  @Column({ type: 'text', nullable: true })
  improvementMeasures: string;

  @Column({ type: 'text', nullable: true })
  lessonsLearned: string;

  @Column({ type: 'int', default: 0 })
  actualDowntimeMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualPowerLoss: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualPartCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualLaborCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalCost: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'submittedById' })
  submittedBy: User;

  @Column({ nullable: true })
  submittedById: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ default: false })
  isVerified: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy: User;

  @Column({ nullable: true })
  verifiedById: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
