import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { WorkOrder } from './work-order.entity';
import { User } from './user.entity';

@Entity('status_histories')
export class StatusHistory extends BaseEntity {
  @Column({ type: 'uuid', name: 'work_order_id' })
  workOrderId: string;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.statusHistories)
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrder;

  @Column({ type: 'varchar', length: 50, name: 'from_status' })
  fromStatus: string;

  @Column({ type: 'varchar', length: 50, name: 'to_status' })
  toStatus: string;

  @Column({ type: 'uuid', name: 'operator_id', nullable: true })
  operatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @Column({ type: 'text', name: 'change_reason', nullable: true })
  changeReason: string;

  @Column({ type: 'text', name: 'remark', nullable: true })
  remark: string;

  @Column({ type: 'jsonb', name: 'snapshot_data', nullable: true })
  snapshotData: Record<string, any>;
}
