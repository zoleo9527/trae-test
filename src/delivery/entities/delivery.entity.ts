import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { ChangeOrder } from '../../change-order/entities/change-order.entity';
import { SignOff } from '../../sign-off/entities/sign-off.entity';

export enum DeliveryStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  RECEIVED = 'received',
  PARTIAL_RECEIVED = 'partial_received',
  RETURNED = 'returned',
}

@Entity('deliveries')
export class Delivery extends BaseEntity {
  @Column({ unique: true, name: 'delivery_number' })
  deliveryNumber: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'project_name' })
  projectName: string;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @Column({ name: 'supplier_name', nullable: true })
  supplierName?: string;

  @Column({ name: 'driver_name', nullable: true })
  driverName?: string;

  @Column({ name: 'vehicle_number', nullable: true })
  vehicleNumber?: string;

  @Column({ type: 'timestamp', name: 'expected_delivery_date', nullable: true })
  expectedDeliveryDate?: Date;

  @Column({ type: 'timestamp', name: 'actual_delivery_date', nullable: true })
  actualDeliveryDate?: Date;

  @Column({ name: 'delivery_location', nullable: true })
  deliveryLocation?: string;

  @Column({ type: 'text', name: 'materials' })
  materials: string;

  @Column({ type: 'decimal', name: 'total_quantity', precision: 12, scale: 2, default: 0 })
  totalQuantity: number;

  @Column({ type: 'decimal', name: 'received_quantity', precision: 12, scale: 2, default: 0 })
  receivedQuantity: number;

  @Column({ type: 'text', name: 'quality_check_notes', nullable: true })
  qualityCheckNotes?: string;

  @Column({ type: 'text', name: 'damage_notes', nullable: true })
  damageNotes?: string;

  @Column({ type: 'text', name: 'tracking_info', nullable: true })
  trackingInfo?: string;

  @Column({ name: 'change_order_id', nullable: true })
  changeOrderId?: string;

  @ManyToOne(() => ChangeOrder, (changeOrder) => changeOrder.deliveries, { nullable: true })
  @JoinColumn({ name: 'change_order_id' })
  changeOrder?: ChangeOrder;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'received_by_id', nullable: true })
  receivedById?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'received_by_id' })
  receivedBy?: User;

  @OneToMany(() => SignOff, (signOff) => signOff.delivery)
  signOffs: SignOff[];

  @Column({ type: 'jsonb', nullable: true })
  materialsList?: Array<{
    name: string;
    specification: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    receivedQuantity: number;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
