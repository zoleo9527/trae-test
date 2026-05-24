import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { TransferStatus } from '../../common/enums/transfer-status.enum';
import { WorkOrder } from '../work-order/work-order.entity';
import { Consultant } from '../consultant/consultant.entity';
import { Comment } from '../comment/comment.entity';

@Entity('transfers')
export class Transfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workOrderId: string;

  @ManyToOne(() => WorkOrder, workOrder => workOrder.transfers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column({ type: 'uuid' })
  fromConsultantId: string;

  @ManyToOne(() => Consultant)
  @JoinColumn({ name: 'fromConsultantId' })
  fromConsultant: Consultant;

  @Column({ type: 'uuid' })
  toConsultantId: string;

  @ManyToOne(() => Consultant)
  @JoinColumn({ name: 'toConsultantId' })
  toConsultant: Consultant;

  @Column({ type: 'text' })
  handoverContent: string;

  @Column({ type: 'text', nullable: true })
  keyNotes: string;

  @Column({ type: 'text', nullable: true })
  pendingItems: string;

  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.INITIATED,
  })
  status: TransferStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'timestamp', nullable: true })
  receivedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'uuid' })
  initiatorId: string;

  @OneToMany(() => Comment, comment => comment.transfer)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;
}
