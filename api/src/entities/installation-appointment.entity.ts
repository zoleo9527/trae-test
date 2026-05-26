import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
}

@Entity('installation_appointments')
export class InstallationAppointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @ManyToOne(() => Order, order => order.appointments)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'date' })
  appointmentDate: string;

  @Column()
  timeSlot: string;

  @Column({ nullable: true })
  installerName: string;

  @Column({ nullable: true })
  installerPhone: string;

  @Column({ nullable: true })
  teamSize: number;

  @Column({
    type: 'simple-enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  customerRemark: string;

  @Column({ type: 'text', nullable: true })
  internalRemark: string;

  @Column({ type: 'text', nullable: true })
  preCheckItems: string;

  @Column({ type: 'datetime', nullable: true })
  actualStartTime: Date;

  @Column({ type: 'datetime', nullable: true })
  actualEndTime: Date;

  @Column({ nullable: true })
  previousAppointmentId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
