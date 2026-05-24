import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { WorkOrder } from './work-order.entity';
import { RepairStep } from './repair-step.entity';

export enum RepairType {
  POLISHING = 'polishing',
  SOLDERING = 'soldering',
  RESIZING = 'resizing',
  STONE_REPLACEMENT = 'stone_replacement',
  CHAIN_REPAIR = 'chain_repair',
  CLASP_REPAIR = 'clasp_repair',
  REFURBISHMENT = 'refurbishment',
  CUSTOM_MODIFICATION = 'custom_modification',
  OTHER = 'other',
}

export enum RepairStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  NEEDS_QUOTATION = 'needs_quotation',
  QUOTATION_APPROVED = 'quotation_approved',
  QUOTATION_REJECTED = 'quotation_rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('repairs')
export class Repair extends BaseEntity {
  @Column({ type: 'uuid', name: 'work_order_id' })
  workOrderId: string;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.repairs)
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrder;

  @Column({ type: 'varchar', length: 50, name: 'repair_no', unique: true })
  repairNo: string;

  @Column({
    type: 'enum',
    enum: RepairType,
    default: RepairType.OTHER,
  })
  repairType: RepairType;

  @Column({
    type: 'enum',
    enum: RepairStatus,
    default: RepairStatus.PENDING,
  })
  status: RepairStatus;

  @Column({ type: 'text', name: 'repair_description' })
  repairDescription: string;

  @Column({ type: 'text', name: 'technician_note', nullable: true })
  technicianNote: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'parts_cost' })
  partsCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'labor_cost' })
  laborCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'total_cost' })
  totalCost: number;

  @Column({ type: 'boolean', name: 'is_warranty', default: false })
  isWarranty: boolean;

  @Column({ type: 'text', name: 'warranty_terms', nullable: true })
  warrantyTerms: string;

  @Column({ type: 'timestamp', name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ type: 'uuid', name: 'technician_id', nullable: true })
  technicianId: string;

  @OneToMany(() => RepairStep, (step) => step.repair, { cascade: true })
  steps: RepairStep[];
}
