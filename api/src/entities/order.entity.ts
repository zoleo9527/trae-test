import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { OrderItem } from './order-item.entity';
import { InstallationAppointment } from './installation-appointment.entity';
import { AcceptanceRecord } from './acceptance-record.entity';
import { ExceptionOrder } from './exception-order.entity';
import { SampleLoan } from './sample-loan.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PRODUCING = 'producing',
  DELIVERED = 'delivered',
  INSTALLING = 'installing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXCEPTION = 'exception',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  orderNo: string;

  @Column()
  customerId: number;

  @ManyToOne(() => Customer, customer => customer.orders)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'decimal', default: 0 })
  totalAmount: number;

  @Column({ type: 'decimal', default: 0 })
  deposit: number;

  @Column({ type: 'text', nullable: true })
  customConfig: string;

  @Column({ nullable: true })
  salesConsultant: string;

  @Column({ nullable: true })
  showroomManager: string;

  @Column({ nullable: true })
  installationCoordinator: string;

  @Column({
    type: 'simple-enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'datetime', nullable: true })
  expectedDeliveryDate: Date;

  @Column({ type: 'datetime', nullable: true })
  actualDeliveryDate: Date;

  @OneToMany(() => OrderItem, item => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => InstallationAppointment, appointment => appointment.order)
  appointments: InstallationAppointment[];

  @OneToMany(() => AcceptanceRecord, record => record.order)
  acceptanceRecords: AcceptanceRecord[];

  @OneToMany(() => ExceptionOrder, exception => exception.order)
  exceptions: ExceptionOrder[];

  @OneToMany(() => SampleLoan, loan => loan.order)
  sampleLoans: SampleLoan[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
