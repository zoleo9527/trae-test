import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Complaint } from './complaint.entity';
import { User } from './user.entity';

@Entity('evidences')
export class Evidence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'complaint_id' })
  complaintId: string;

  @ManyToOne(() => Complaint, complaint => complaint.evidences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'complaint_id' })
  complaint: Complaint;

  @Column({ name: 'file_name', length: 255, nullable: true })
  fileName: string;

  @Column({ name: 'file_path', length: 255, nullable: true })
  filePath: string;

  @Column({ name: 'file_size', nullable: true })
  fileSize: number;

  @Column({ name: 'uploaded_by', nullable: true })
  uploadedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}