import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ProjectStatus, ProjectPhase } from '../common/enums/project.enum';
import { Supplier } from './supplier.entity';
import { Credential } from './credential.entity';
import { Material } from './material.entity';
import { Settlement } from './settlement.entity';
import { CheckinRecord } from './checkin-record.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  projectNo: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
  })
  status: ProjectStatus;

  @Column({
    type: 'enum',
    enum: ProjectPhase,
    nullable: true,
  })
  currentPhase: ProjectPhase;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  constructionStartDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  constructionEndDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  exhibitionStartDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  exhibitionEndDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  teardownStartDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  teardownEndDate: Date;

  @Column({ nullable: true })
  venue: string;

  @Column({ nullable: true })
  boothNo: string;

  @Column({ nullable: true })
  coordinator: string;

  @Column({ nullable: true })
  coordinatorPhone: string;

  @Column({ nullable: true })
  siteSupervisor: string;

  @Column({ nullable: true })
  siteSupervisorPhone: string;

  @ManyToOne(() => Supplier, (supplier) => supplier.projects, { nullable: true })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @Column({ nullable: true })
  supplierId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetAmount: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Credential, (credential) => credential.project)
  credentials: Credential[];

  @OneToMany(() => Material, (material) => material.project)
  materials: Material[];

  @OneToMany(() => Settlement, (settlement) => settlement.project)
  settlements: Settlement[];

  @OneToMany(() => CheckinRecord, (checkin) => checkin.project)
  checkinRecords: CheckinRecord[];
}
