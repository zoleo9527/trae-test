import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Repair } from './repair.entity';

export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

@Entity('repair_steps')
export class RepairStep extends BaseEntity {
  @Column({ type: 'uuid', name: 'repair_id' })
  repairId: string;

  @ManyToOne(() => Repair, (repair) => repair.steps)
  @JoinColumn({ name: 'repair_id' })
  repair: Repair;

  @Column({ type: 'int', name: 'step_order' })
  stepOrder: number;

  @Column({ type: 'varchar', length: 200, name: 'step_name' })
  stepName: string;

  @Column({ type: 'text', nullable: true, name: 'step_description' })
  stepDescription: string;

  @Column({
    type: 'enum',
    enum: StepStatus,
    default: StepStatus.PENDING,
  })
  status: StepStatus;

  @Column({ type: 'text', nullable: true, name: 'operator_note' })
  operatorNote: string;

  @Column({ type: 'timestamp', name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ type: 'uuid', name: 'operator_id', nullable: true })
  operatorId: string;
}
