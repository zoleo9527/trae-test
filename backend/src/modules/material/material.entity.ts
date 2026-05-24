import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { MaterialStatus, MaterialType } from '../../common/enums/material-status.enum';
import { WorkOrder } from '../work-order/work-order.entity';
import { Consultant } from '../consultant/consultant.entity';
import { MaterialVersion } from './material-version.entity';
import { Comment } from '../comment/comment.entity';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workOrderId: string;

  @ManyToOne(() => WorkOrder, workOrder => workOrder.materials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: MaterialType,
  })
  type: MaterialType;

  @Column({
    type: 'enum',
    enum: MaterialStatus,
    default: MaterialStatus.DRAFT,
  })
  status: MaterialStatus;

  @Column({ default: 1 })
  currentVersion: number;

  @Column({ type: 'text', nullable: true })
  fileUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  deadline: Date;

  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => Consultant)
  @JoinColumn({ name: 'ownerId' })
  owner: Consultant;

  @OneToMany(() => MaterialVersion, version => version.material, { cascade: true })
  versions: MaterialVersion[];

  @OneToMany(() => Comment, comment => comment.material)
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
