import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ResupplyRequest } from './resupply-request.entity';

@Entity('evidence_chain')
export class EvidenceChain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'request_id', nullable: true })
  requestId: string;

  @Column({ name: 'action_type' })
  actionType: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'operator' })
  operator: string;

  @Column({ name: 'operator_role' })
  operatorRole: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ResupplyRequest, req => req.evidenceChain, { nullable: true })
  @JoinColumn({ name: 'request_id' })
  resupplyRequest: ResupplyRequest;
}
