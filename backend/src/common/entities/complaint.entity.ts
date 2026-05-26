import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Recheck } from './recheck.entity';
import { Compensation } from './compensation.entity';
import { StatusLog } from './status-log.entity';
import { Evidence } from './evidence.entity';

export type ComplaintStatus = 'pending' | 'rechecking' | 'compensating' | 'payment_pending' | 'completed' | 'rejected';

@Entity('complaints')
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_name', length: 100 })
  customerName: string;

  @Column({ name: 'customer_phone', length: 20, nullable: true })
  customerPhone: string;

  @Column({ name: 'complaint_type', length: 50 })
  complaintType: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'weight_note_no', length: 50, nullable: true })
  weightNoteNo: string;

  @Column({ name: 'cold_storage_no', length: 50, nullable: true })
  coldStorageNo: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: ComplaintStatus;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => Recheck, recheck => recheck.complaint)
  rechecks: Recheck[];

  @OneToMany(() => Compensation, compensation => compensation.complaint)
  compensations: Compensation[];

  @OneToMany(() => StatusLog, log => log.complaint)
  statusLogs: StatusLog[];

  @OneToMany(() => Evidence, evidence => evidence.complaint)
  evidences: Evidence[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
