import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ChangeOrderStatus, ChangeOrderType } from '../../common/enums/change-order-status.enum';
import { User } from '../../user/entities/user.entity';
import { ChangeOrderVersion } from './change-order-version.entity';
import { SignOff } from '../../sign-off/entities/sign-off.entity';
import { DailyReport } from '../../daily-report/entities/daily-report.entity';
import { Delivery } from '../../delivery/entities/delivery.entity';

@Entity('change_orders')
export class ChangeOrder extends BaseEntity {
  @Column({ unique: true, name: 'order_number' })
  orderNumber: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ChangeOrderType,
    name: 'change_type',
  })
  changeType: ChangeOrderType;

  @Column({
    type: 'enum',
    enum: ChangeOrderStatus,
    default: ChangeOrderStatus.DRAFT,
  })
  status: ChangeOrderStatus;

  @Column({ type: 'text', name: 'rework_reason', nullable: true })
  reworkReason?: string;

  @Column({ type: 'text', name: 'material_tracking', nullable: true })
  materialTracking?: string;

  @Column({ type: 'decimal', name: 'original_amount', precision: 12, scale: 2, default: 0 })
  originalAmount: number;

  @Column({ type: 'decimal', name: 'changed_amount', precision: 12, scale: 2, default: 0 })
  changedAmount: number;

  @Column({ type: 'decimal', name: 'labor_cost', precision: 12, scale: 2, default: 0 })
  laborCost: number;

  @Column({ type: 'decimal', name: 'material_cost', precision: 12, scale: 2, default: 0 })
  materialCost: number;

  @Column({ type: 'decimal', name: 'equipment_cost', precision: 12, scale: 2, default: 0 })
  equipmentCost: number;

  @Column({ type: 'decimal', name: 'other_cost', precision: 12, scale: 2, default: 0 })
  otherCost: number;

  @Column({ type: 'int', name: 'estimated_days', nullable: true })
  estimatedDays?: number;

  @Column({ type: 'timestamp', name: 'proposed_date', nullable: true })
  proposedDate?: Date;

  @Column({ type: 'timestamp', name: 'approved_date', nullable: true })
  approvedDate?: Date;

  @Column({ type: 'timestamp', name: 'completed_date', nullable: true })
  completedDate?: Date;

  @Column({ type: 'timestamp', name: 'settled_date', nullable: true })
  settledDate?: Date;

  @Column({ type: 'text', name: 'reject_reason', nullable: true })
  rejectReason?: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'project_name' })
  projectName: string;

  @Column({ name: 'construction_site', nullable: true })
  constructionSite?: string;

  @Column({ name: 'team_name', nullable: true })
  teamName?: string;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @ManyToOne(() => User, (user) => user.createdChangeOrders)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'approved_by_id', nullable: true })
  approvedById?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy?: User;

  @Column({ name: 'current_version', default: 1 })
  currentVersion: number;

  @Column({ name: 'sign_off_process_version', default: 1 })
  signOffProcessVersion: number;

  @OneToMany(() => ChangeOrderVersion, (version) => version.changeOrder)
  versions: ChangeOrderVersion[];

  @OneToMany(() => SignOff, (signOff) => signOff.changeOrder)
  signOffs: SignOff[];

  @OneToMany(() => DailyReport, (report) => report.changeOrder)
  dailyReports: DailyReport[];

  @OneToMany(() => Delivery, (delivery) => delivery.changeOrder)
  deliveries: Delivery[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
