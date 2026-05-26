import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Compensation } from './compensation.entity';
import { User } from './user.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'compensation_id' })
  compensationId: string;

  @ManyToOne(() => Compensation, compensation => compensation.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'compensation_id' })
  compensation: Compensation;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'payment_date', type: 'timestamp', nullable: true })
  paymentDate: Date;

  @Column({ name: 'payment_method', length: 50, nullable: true })
  paymentMethod: string;

  @Column({ name: 'recorded_by', nullable: true })
  recordedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recorded_by' })
  recorder: User;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
