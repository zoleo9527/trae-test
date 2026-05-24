import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { RefundStatus } from '../../common/enums/refund-status.enum';
import { WorkOrder } from '../work-order/work-order.entity';
import { Consultant } from '../consultant/consultant.entity';
import { Comment } from '../comment/comment.entity';

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workOrderId: string;

  @ManyToOne(() => WorkOrder, workOrder => workOrder.refunds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  requestedAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  approvedAmount: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  negotiationHistory: string;

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.DRAFT,
  })
  status: RefundStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'uuid' })
  initiatorId: string;

  @ManyToOne(() => Consultant)
  @JoinColumn({ name: 'initiatorId' })
  initiator: Consultant;

  @Column({ type: 'uuid', nullable: true })
  reviewerId: string;

  @ManyToOne(() => Consultant)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: Consultant;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @OneToMany(() => Comment, comment => comment.refund)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;
}
