import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Camper } from './camper.entity';

@Entity('medical_reports')
export class MedicalReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'camper_id' })
  camperId: string;

  @Column()
  symptom: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'report_type' })
  reportType: string;

  @Column({ name: 'reported_by' })
  reportedBy: string;

  @Column({ name: 'handled_by', nullable: true })
  handledBy: string;

  @Column({ type: 'text', name: 'handling_note', nullable: true })
  handlingNote: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'text', name: 'parent_notification', nullable: true })
  parentNotification: string;

  @Column({ name: 'parent_notified', default: false })
  parentNotified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Camper, camper => camper.medicalReports)
  @JoinColumn({ name: 'camper_id' })
  camper: Camper;
}
