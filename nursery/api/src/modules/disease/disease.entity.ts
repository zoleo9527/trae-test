import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Inspection } from '../inspection/inspection.entity';
import { Negotiation } from '../negotiation/negotiation.entity';
import { Plot } from '../plot/plot.entity';
import { User } from '../user/user.entity';
import { DiseaseTimeline } from './disease-timeline.entity';

export enum DiseaseSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
}

export enum DiseaseStatus {
  REPORTED = 'reported',
  CONFIRMED = 'confirmed',
  TREATING = 'treating',
  RESOLVED = 'resolved',
}

@Entity('diseases')
export class Disease {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Inspection, (inspection) => inspection.disease, { nullable: true })
  @JoinColumn({ name: 'inspection_id' })
  inspection?: Inspection;

  @Column({ name: 'inspection_id', nullable: true })
  inspectionId?: number;

  @ManyToOne(() => Plot)
  @JoinColumn({ name: 'plot_id' })
  plot: Plot;

  @Column({ name: 'plot_id' })
  plotId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ name: 'reporter_id' })
  reporterId: number;

  @Column({ name: 'type', length: 100 })
  type: string;

  @Column({ name: 'severity', type: 'enum', enum: DiseaseSeverity })
  severity: DiseaseSeverity;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'affected_quantity', nullable: true })
  affectedQuantity: number;

  @Column({ name: 'status', type: 'enum', enum: DiseaseStatus, default: DiseaseStatus.REPORTED })
  status: DiseaseStatus;

  @Column({ name: 'reported_at', type: 'timestamp' })
  reportedAt: Date;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'is_overdue', default: false })
  isOverdue: boolean;

  @OneToMany(() => DiseaseTimeline, (timeline) => timeline.disease, { eager: true })
  timelines: DiseaseTimeline[];

  @OneToMany(() => Negotiation, (negotiation) => negotiation.disease)
  negotiations: Negotiation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
