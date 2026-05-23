import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { WorkOrderStatus } from '../common/enums/work-order.enum';
import { User } from './user.entity';

@Entity('status_histories')
export class StatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column()
  workOrderId: string;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
  })
  fromStatus: WorkOrderStatus;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
  })
  toStatus: WorkOrderStatus;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'operatedById' })
  operatedBy: User;

  @Column({ nullable: true })
  operatedById: string;

  @CreateDateColumn()
  operatedAt: Date;
}
