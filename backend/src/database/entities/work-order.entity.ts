import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Member } from './member.entity';
import { User } from './user.entity';
import { WorkOrderItem } from './work-order-item.entity';
import { Repair } from './repair.entity';
import { FollowUp } from './follow-up.entity';
import { StatusHistory } from './status-history.entity';

export enum WorkOrderType {
  REPAIR = 'repair',
  CUSTOM = 'custom',
  TRANSFER = 'transfer',
  RETURN = 'return',
  EXCHANGE = 'exchange',
  CLEANING = 'cleaning',
}

export enum WorkOrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum WorkOrderStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  REVIEWED = 'reviewed',
  IN_PROGRESS = 'in_progress',
  PENDING_CONFIRM = 'pending_confirm',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  NEEDS_REVIEW = 'needs_review',
}

@Entity('work_orders')
export class WorkOrder extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'order_no', unique: true })
  orderNo: string;

  @Column({
    type: 'enum',
    enum: WorkOrderType,
    default: WorkOrderType.REPAIR,
  })
  type: WorkOrderType;

  @Column({
    type: 'enum',
    enum: WorkOrderPriority,
    default: WorkOrderPriority.NORMAL,
  })
  priority: WorkOrderPriority;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.DRAFT,
  })
  status: WorkOrderStatus;

  @Column({ type: 'uuid', name: 'member_id' })
  memberId: string;

  @ManyToOne(() => Member, (member) => member.workOrders)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ type: 'uuid', name: 'handler_id', nullable: true })
  handlerId: string;

  @ManyToOne(() => User, (user) => user.handledOrders)
  @JoinColumn({ name: 'handler_id' })
  handler: User;

  @Column({ type: 'text', name: 'problem_description' })
  problemDescription: string;

  @Column({ type: 'text', name: 'customer_requirement', nullable: true })
  customerRequirement: string;

  @Column({ type: 'text', name: 'internal_note', nullable: true })
  internalNote: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'estimated_cost' })
  estimatedCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'actual_cost' })
  actualCost: number;

  @Column({ type: 'timestamp', name: 'expected_completion_at', nullable: true })
  expectedCompletionAt: Date;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ type: 'boolean', name: 'needs_follow_up', default: true })
  needsFollowUp: boolean;

  @Column({ type: 'boolean', name: 'is_payment_confirmed', default: false })
  isPaymentConfirmed: boolean;

  @OneToMany(() => WorkOrderItem, (item) => item.workOrder, { cascade: true })
  items: WorkOrderItem[];

  @OneToMany(() => Repair, (repair) => repair.workOrder)
  repairs: Repair[];

  @OneToMany(() => FollowUp, (followUp) => followUp.workOrder)
  followUps: FollowUp[];

  @OneToMany(() => StatusHistory, (history) => history.workOrder)
  statusHistories: StatusHistory[];
}
