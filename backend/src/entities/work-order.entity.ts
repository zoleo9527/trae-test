import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { WorkOrderStatus, AbnormalType } from '../common/enums/work-order.enum';
import { User } from './user.entity';
import { DowntimeRecord } from './downtime-record.entity';
import { PartUsage } from './part-usage.entity';
import { ReviewRecord } from './review-record.entity';
import { StatusHistory } from './status-history.entity';

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNo: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.ABNORMAL_REPORTED,
  })
  status: WorkOrderStatus;

  @Column({
    type: 'enum',
    enum: AbnormalType,
  })
  abnormalType: AbnormalType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  equipmentNo: string;

  @Column()
  station: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  powerLoss: number;

  @Column({ type: 'int', nullable: true })
  totalDowntimeMinutes: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column({ nullable: true })
  reporterId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'handlerId' })
  handler: User;

  @Column({ nullable: true })
  handlerId: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @OneToMany(() => DowntimeRecord, record => record.workOrder)
  downtimeRecords: DowntimeRecord[];

  @OneToMany(() => PartUsage, usage => usage.workOrder)
  partUsages: PartUsage[];

  @OneToMany(() => ReviewRecord, review => review.workOrder)
  reviewRecords: ReviewRecord[];

  @OneToMany(() => StatusHistory, history => history.workOrder)
  statusHistories: StatusHistory[];

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
