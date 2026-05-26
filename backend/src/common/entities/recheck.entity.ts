import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Complaint } from './complaint.entity';
import { User } from './user.entity';

@Entity('rechecks')
export class Recheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'complaint_id' })
  complaintId: string;

  @ManyToOne(() => Complaint, complaint => complaint.rechecks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'complaint_id' })
  complaint: Complaint;

  @Column({ name: 'recheck_person', length: 100, nullable: true })
  recheckPerson: string;

  @Column({ name: 'cold_storage_location', length: 100, nullable: true })
  coldStorageLocation: string;

  @Column({ name: 'recheck_time', type: 'timestamp', nullable: true })
  recheckTime: Date;

  @Column({ name: 'grade_result', length: 50, nullable: true })
  gradeResult: string;

  @Column({ name: 'loss_ratio', type: 'decimal', precision: 5, scale: 2, nullable: true })
  lossRatio: number;

  @Column({ name: 'loss_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  lossAmount: number;

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
