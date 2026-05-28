import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Camper } from './camper.entity';
import { Material } from './material.entity';
import { EvidenceChain } from './evidence-chain.entity';

@Entity('resupply_requests')
export class ResupplyRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'camper_id' })
  camperId: string;

  @Column({ name: 'material_id' })
  materialId: string;

  @Column()
  quantity: number;

  @Column({ name: 'request_type' })
  requestType: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'requested_by' })
  requestedBy: string;

  @Column({ name: 'current_handler', nullable: true })
  currentHandler: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @Column({ type: 'text', name: 'reject_reason', nullable: true })
  rejectReason: string;

  @Column({ name: 'fulfilled_by', nullable: true })
  fulfilledBy: string;

  @Column({ type: 'text', name: 'fulfill_note', nullable: true })
  fulfillNote: string;

  @Column({ type: 'text', name: 'followup_note', nullable: true })
  followupNote: string;

  @Column({ name: 'parent_notified', default: false })
  parentNotified: boolean;

  @Column({ name: 'parent_notified_at', nullable: true })
  parentNotifiedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Camper, camper => camper.resupplyRequests)
  @JoinColumn({ name: 'camper_id' })
  camper: Camper;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @OneToMany(() => EvidenceChain, evidence => evidence.resupplyRequest)
  evidenceChain: EvidenceChain[];
}
