import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Complaint } from './complaint.entity';
import { User } from './user.entity';
import { Payment } from './payment.entity';

export type CompensationStatus = 'pending' | 'approved' | 'rejected';

@Entity('compensations')
export class Compensation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'complaint_id' })
  complaintId: string;

  @ManyToOne(() => Complaint, complaint => complaint.compensations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'complaint_id' })
  complaint: Complaint;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'compensation_method', length: 50, nullable: true })
  compensationMethod: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: CompensationStatus;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approver: User;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @OneToMany(() => Payment, payment => payment.compensation)
  payments: Payment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
