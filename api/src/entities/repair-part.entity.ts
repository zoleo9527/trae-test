import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { ExceptionOrder } from './exception-order.entity';
import { Product } from './product.entity';

export enum RepairPartStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  ORDERED = 'ordered',
  SHIPPED = 'shipped',
  RECEIVED = 'received',
  INSTALLED = 'installed',
  CANCELLED = 'cancelled',
}

@Entity('repair_parts')
export class RepairPart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  exceptionOrderId: number;

  @ManyToOne(() => ExceptionOrder, exception => exception.repairParts)
  @JoinColumn({ name: 'exceptionOrderId' })
  exceptionOrder: ExceptionOrder;

  @Column({ nullable: true })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  partName: string;

  @Column({ nullable: true })
  partModel: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', default: 0 })
  cost: number;

  @Column({
    type: 'simple-enum',
    enum: RepairPartStatus,
    default: RepairPartStatus.REQUESTED,
  })
  status: RepairPartStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'datetime', nullable: true })
  expectedDeliveryDate: Date;

  @Column({ type: 'datetime', nullable: true })
  actualDeliveryDate: Date;

  @Column({ type: 'text', nullable: true })
  trackingInfo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
