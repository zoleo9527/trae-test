import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { SignOffStatus, SignOffType } from '../../common/enums/sign-off.enum';
import { User } from '../../user/entities/user.entity';
import { ChangeOrder } from '../../change-order/entities/change-order.entity';
import { DailyReport } from '../../daily-report/entities/daily-report.entity';
import { Delivery } from '../../delivery/entities/delivery.entity';

@Entity('sign_offs')
export class SignOff extends BaseEntity {
  @Column({
    type: 'enum',
    enum: SignOffType,
    name: 'sign_off_type',
  })
  signOffType: SignOffType;

  @Column({
    type: 'enum',
    enum: SignOffStatus,
    default: SignOffStatus.PENDING,
  })
  status: SignOffStatus;

  @Column({ name: 'sequence_order', default: 1 })
  sequenceOrder: number;

  @Column({ name: 'change_order_id', nullable: true })
  changeOrderId?: string;

  @ManyToOne(() => ChangeOrder, (changeOrder) => changeOrder.signOffs, { nullable: true })
  @JoinColumn({ name: 'change_order_id' })
  changeOrder?: ChangeOrder;

  @Column({ name: 'daily_report_id', nullable: true })
  dailyReportId?: string;

  @ManyToOne(() => DailyReport, (report) => report.signOffs, { nullable: true })
  @JoinColumn({ name: 'daily_report_id' })
  dailyReport?: DailyReport;

  @Column({ name: 'delivery_id', nullable: true })
  deliveryId?: string;

  @ManyToOne(() => Delivery, (delivery) => delivery.signOffs, { nullable: true })
  @JoinColumn({ name: 'delivery_id' })
  delivery?: Delivery;

  @Column({ name: 'requested_by_id' })
  requestedById: string;

  @ManyToOne(() => User, (user) => user.requestedSignOffs)
  @JoinColumn({ name: 'requested_by_id' })
  requestedBy: User;

  @Column({ name: 'signed_by_id', nullable: true })
  signedById?: string;

  @ManyToOne(() => User, (user) => user.signedSignOffs, { nullable: true })
  @JoinColumn({ name: 'signed_by_id' })
  signedBy?: User;

  @Column({ type: 'timestamp', name: 'signed_at', nullable: true })
  signedAt?: Date;

  @Column({ type: 'timestamp', name: 'deadline', nullable: true })
  deadline?: Date;

  @Column({ type: 'text', name: 'comments', nullable: true })
  comments?: string;

  @Column({ type: 'text', name: 'reject_reason', nullable: true })
  rejectReason?: string;

  @Column({ type: 'text', nullable: true })
  signature?: string;

  @Column({ name: 'signer_role', nullable: true })
  signerRole?: string;

  @Column({ name: 'signer_department', nullable: true })
  signerDepartment?: string;

  @Column({ name: 'process_version', default: 1 })
  processVersion: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
