import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { SparePart } from './spare-part.entity';
import { User } from './user.entity';

export enum PartRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RECEIVED = 'received',
}

@Entity('part_usages')
export class PartUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column()
  workOrderId: string;

  @ManyToOne(() => SparePart)
  @JoinColumn({ name: 'sparePartId' })
  sparePart: SparePart;

  @Column()
  sparePartId: string;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: PartRequestStatus,
    default: PartRequestStatus.PENDING,
  })
  status: PartRequestStatus;

  @Column({ type: 'text', nullable: true })
  requestReason: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'requestedById' })
  requestedBy: User;

  @Column({ nullable: true })
  requestedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column({ nullable: true })
  approvedById: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  approvalRemark: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'receivedById' })
  receivedBy: User;

  @Column({ nullable: true })
  receivedById: string;

  @Column({ type: 'timestamp', nullable: true })
  receivedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
