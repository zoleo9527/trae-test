import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Complaint } from './complaint.entity';
import { User } from './user.entity';

@Entity('status_logs')
export class StatusLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'complaint_id' })
  complaintId: string;

  @ManyToOne(() => Complaint, complaint => complaint.statusLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'complaint_id' })
  complaint: Complaint;

  @Column({ name: 'from_status', length: 20, nullable: true })
  fromStatus: string;

  @Column({ name: 'to_status', length: 20, nullable: true })
  toStatus: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ name: 'operator_id', nullable: true })
  operatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
