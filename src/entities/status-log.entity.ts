import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Credential } from './credential.entity';
import { Material } from './material.entity';
import { Settlement } from './settlement.entity';
import { Project } from './project.entity';

@Entity('status_logs')
export class StatusLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column()
  fromStatus: string;

  @Column()
  toStatus: string;

  @Column({ nullable: true })
  operator: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Project, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ nullable: true })
  projectId: string;

  @ManyToOne(() => Credential, (credential) => credential.statusLogs, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'credentialId' })
  credential: Credential;

  @Column({ nullable: true })
  credentialId: string;

  @ManyToOne(() => Material, (material) => material.statusLogs, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'materialId' })
  material: Material;

  @Column({ nullable: true })
  materialId: string;

  @ManyToOne(() => Settlement, (settlement) => settlement.statusLogs, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'settlementId' })
  settlement: Settlement;

  @Column({ nullable: true })
  settlementId: string;
}
