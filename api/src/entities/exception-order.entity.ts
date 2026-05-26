import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { RepairPart } from './repair-part.entity';

export enum ExceptionType {
  SAMPLE_NOT_RETURNED = 'sample_not_returned',
  MISSING_PARTS = 'missing_parts',
  QUALITY_ISSUE = 'quality_issue',
  INSTALLATION_PROBLEM = 'installation_problem',
  CUSTOMER_COMPLAINT = 'customer_complaint',
  DELIVERY_DELAY = 'delivery_delay',
  CUSTOM_CONFIG_ISSUE = 'custom_config_issue',
  OTHER = 'other',
}

export enum ExceptionStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  AWAITING_CUSTOMER = 'awaiting_customer',
  AWAITING_SUPPLIER = 'awaiting_supplier',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity('exception_orders')
export class ExceptionOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @ManyToOne(() => Order, order => order.exceptions)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({
    type: 'simple-enum',
    enum: ExceptionType,
  })
  type: ExceptionType;

  @Column({
    type: 'simple-enum',
    enum: ExceptionStatus,
    default: ExceptionStatus.OPEN,
  })
  status: ExceptionStatus;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  impact: string;

  @Column({ nullable: true })
  reportedBy: string;

  @Column({ nullable: true })
  assignee: string;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ type: 'text', nullable: true })
  rootCause: string;

  @Column({ type: 'text', nullable: true })
  preventiveMeasures: string;

  @Column({ type: 'datetime', nullable: true })
  resolvedAt: Date;

  @OneToMany(() => RepairPart, part => part.exceptionOrder, { cascade: true })
  repairParts: RepairPart[];

  @Column({ type: 'text', nullable: true })
  communicationHistory: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
