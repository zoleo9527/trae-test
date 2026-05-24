import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WorkOrder } from '../work-order/work-order.entity';
import { Refund } from '../refund/refund.entity';
import { Transfer } from '../transfer/transfer.entity';
import { Material } from '../material/material.entity';
import { Consultant } from '../consultant/consultant.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  workOrderId: string;

  @ManyToOne(() => WorkOrder, workOrder => workOrder.comments, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column({ type: 'uuid', nullable: true })
  refundId: string;

  @ManyToOne(() => Refund, refund => refund.comments, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'refundId' })
  refund: Refund;

  @Column({ type: 'uuid', nullable: true })
  transferId: string;

  @ManyToOne(() => Transfer, transfer => transfer.comments, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'transferId' })
  transfer: Transfer;

  @Column({ type: 'uuid', nullable: true })
  materialId: string;

  @ManyToOne(() => Material, material => material.comments, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'materialId' })
  material: Material;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => Consultant)
  @JoinColumn({ name: 'authorId' })
  author: Consultant;

  @Column({ default: false })
  isPrivate: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
