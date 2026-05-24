import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { WorkOrder } from './work-order.entity';
import { Product } from './product.entity';

export enum ItemHandoverStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  RETURNED = 'returned',
  SHIPPED = 'shipped',
}

@Entity('work_order_items')
export class WorkOrderItem extends BaseEntity {
  @Column({ type: 'uuid', name: 'work_order_id' })
  workOrderId: string;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.items)
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrder;

  @Column({ type: 'uuid', name: 'product_id', nullable: true })
  productId: string;

  @ManyToOne(() => Product, (product) => product.workOrderItems)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'varchar', length: 200, name: 'item_name' })
  itemName: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'item_spec' })
  itemSpec: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'item_value' })
  itemValue: number;

  @Column({
    type: 'enum',
    enum: ItemHandoverStatus,
    default: ItemHandoverStatus.PENDING,
    name: 'handover_status',
  })
  handoverStatus: ItemHandoverStatus;

  @Column({ type: 'text', name: 'condition_before', nullable: true })
  conditionBefore: string;

  @Column({ type: 'text', name: 'condition_after', nullable: true })
  conditionAfter: string;

  @Column({ type: 'text', name: 'handover_remark', nullable: true })
  handoverRemark: string;

  @Column({ type: 'text', name: 'image_urls_before', nullable: true })
  imageUrlsBefore: string;

  @Column({ type: 'text', name: 'image_urls_after', nullable: true })
  imageUrlsAfter: string;

  @Column({ type: 'timestamp', name: 'received_at', nullable: true })
  receivedAt: Date;

  @Column({ type: 'uuid', name: 'received_by', nullable: true })
  receivedBy: string;

  @Column({ type: 'timestamp', name: 'returned_at', nullable: true })
  returnedAt: Date;

  @Column({ type: 'uuid', name: 'returned_by', nullable: true })
  returnedBy: string;
}
