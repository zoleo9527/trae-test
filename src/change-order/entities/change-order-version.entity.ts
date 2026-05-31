import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ChangeOrder } from './change-order.entity';
import { User } from '../../user/entities/user.entity';

@Entity('change_order_versions')
export class ChangeOrderVersion extends BaseEntity {
  @Column({ name: 'change_order_id' })
  changeOrderId: string;

  @ManyToOne(() => ChangeOrder, (changeOrder) => changeOrder.versions)
  @JoinColumn({ name: 'change_order_id' })
  changeOrder: ChangeOrder;

  @Column({ name: 'version_number' })
  versionNumber: number;

  @Column({ type: 'jsonb', name: 'snapshot_data' })
  snapshotData: Record<string, any>;

  @Column({ type: 'text', name: 'change_summary', nullable: true })
  changeSummary?: string;

  @Column({ type: 'jsonb', name: 'changes' })
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;
}
