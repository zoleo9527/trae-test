import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Member } from './member.entity';
import { WorkOrder } from './work-order.entity';
import { User } from './user.entity';

export enum FollowUpType {
  AFTER_SALES = 'after_sales',
  REPAIR_COMPLETED = 'repair_completed',
  BIRTHDAY = 'birthday',
  MEMBER_CARE = 'member_care',
  COMPLAINT = 'complaint',
  OTHER = 'other',
}

export enum FollowUpChannel {
  PHONE = 'phone',
  WECHAT = 'wechat',
  SMS = 'sms',
  EMAIL = 'email',
  IN_PERSON = 'in_person',
}

export enum FollowUpResult {
  SATISFIED = 'satisfied',
  PARTIALLY_SATISFIED = 'partially_satisfied',
  DISSATISFIED = 'dissatisfied',
  NO_ANSWER = 'no_answer',
  CALL_BACK_LATER = 'call_back_later',
}

export enum FollowUpStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('follow_ups')
export class FollowUp extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'follow_up_no', unique: true })
  followUpNo: string;

  @Column({ type: 'uuid', name: 'member_id' })
  memberId: string;

  @ManyToOne(() => Member, (member) => member.followUps)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ type: 'uuid', name: 'work_order_id', nullable: true })
  workOrderId: string;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.followUps)
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrder;

  @Column({
    type: 'enum',
    enum: FollowUpType,
    default: FollowUpType.AFTER_SALES,
  })
  type: FollowUpType;

  @Column({
    type: 'enum',
    enum: FollowUpChannel,
    default: FollowUpChannel.PHONE,
  })
  channel: FollowUpChannel;

  @Column({
    type: 'enum',
    enum: FollowUpStatus,
    default: FollowUpStatus.PENDING,
  })
  status: FollowUpStatus;

  @Column({ type: 'enum', enum: FollowUpResult, nullable: true })
  result: FollowUpResult;

  @Column({ type: 'uuid', name: 'assigned_to', nullable: true })
  assignedTo: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignee: User;

  @Column({ type: 'text', name: 'follow_up_content' })
  followUpContent: string;

  @Column({ type: 'text', name: 'customer_feedback', nullable: true })
  customerFeedback: string;

  @Column({ type: 'text', nullable: true, name: 'internal_note' })
  internalNote: string;

  @Column({ type: 'timestamp', name: 'planned_at' })
  plannedAt: Date;

  @Column({ type: 'timestamp', name: 'actual_at', nullable: true })
  actualAt: Date;

  @Column({ type: 'int', name: 'follow_up_count', default: 0 })
  followUpCount: number;

  @Column({ type: 'timestamp', name: 'next_follow_up_at', nullable: true })
  nextFollowUpAt: Date;

  @Column({ type: 'boolean', name: 'needs_escalation', default: false })
  needsEscalation: boolean;

  @Column({ type: 'text', name: 'escalation_reason', nullable: true })
  escalationReason: string;
}
