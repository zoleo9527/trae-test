import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @ManyToOne(() => Order, order => order.items)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productName: string;

  @Column({ nullable: true })
  productModel: string;

  @Column({ type: 'text', nullable: true })
  customSpec: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', default: 0 })
  unitPrice: number;

  @Column({ type: 'decimal', default: 0 })
  subtotal: number;

  @Column({ default: 'pending' })
  deliveryStatus: string;

  @Column({ type: 'datetime', nullable: true })
  deliveredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
