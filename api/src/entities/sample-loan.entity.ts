import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

export enum SampleLoanStatus {
  BORROWED = 'borrowed',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  LOST = 'lost',
  KEPT_BY_CUSTOMER = 'kept_by_customer',
}

@Entity('sample_loans')
export class SampleLoan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  orderId: number;

  @ManyToOne(() => Order, order => order.sampleLoans)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  customerName: string;

  @Column()
  customerPhone: string;

  @Column()
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productName: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'date' })
  borrowDate: string;

  @Column({ type: 'date', nullable: true })
  expectedReturnDate: string;

  @Column({ type: 'date', nullable: true })
  actualReturnDate: string;

  @Column({
    type: 'simple-enum',
    enum: SampleLoanStatus,
    default: SampleLoanStatus.BORROWED,
  })
  status: SampleLoanStatus;

  @Column({ type: 'text', nullable: true })
  purpose: string;

  @Column({ type: 'text', nullable: true })
  conditionOnBorrow: string;

  @Column({ type: 'text', nullable: true })
  conditionOnReturn: string;

  @Column({ type: 'text', nullable: true })
  followUpNotes: string;

  @Column({ type: 'decimal', default: 0 })
  depositAmount: number;

  @Column({ default: false })
  depositReturned: boolean;

  @Column({ nullable: true })
  handledBy: string;

  @Column({ type: 'int', default: 0 })
  reminderCount: number;

  @Column({ type: 'datetime', nullable: true })
  lastReminderAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
