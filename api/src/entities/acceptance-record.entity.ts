import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

export enum AcceptanceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed',
  RECTIFIED = 'rectified',
}

@Entity('acceptance_records')
export class AcceptanceRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @ManyToOne(() => Order, order => order.acceptanceRecords)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ nullable: true })
  appointmentId: number;

  @Column({
    type: 'simple-enum',
    enum: AcceptanceStatus,
    default: AcceptanceStatus.PENDING,
  })
  status: AcceptanceStatus;

  @Column({ type: 'text', nullable: true })
  overallEvaluation: string;

  @Column({ type: 'text', nullable: true })
  qualityIssues: string;

  @Column({ type: 'text', nullable: true })
  installationIssues: string;

  @Column({ type: 'text', nullable: true })
  missingItems: string;

  @Column({ type: 'text', nullable: true })
  rectificationPlan: string;

  @Column({ type: 'text', nullable: true })
  customerFeedback: string;

  @Column({ default: 0 })
  satisfactionScore: number;

  @Column({ type: 'datetime', nullable: true })
  inspectionTime: Date;

  @Column({ nullable: true })
  inspectorName: string;

  @Column({ nullable: true })
  customerSignature: boolean;

  @Column({ type: 'text', nullable: true })
  photos: string;

  @Column({ type: 'datetime', nullable: true })
  rectificationDueDate: Date;

  @Column({ type: 'datetime', nullable: true })
  rectificationCompletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
