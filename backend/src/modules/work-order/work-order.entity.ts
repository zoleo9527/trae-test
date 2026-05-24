import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';
import { Student } from '../student/student.entity';
import { Consultant } from '../consultant/consultant.entity';
import { Refund } from '../refund/refund.entity';
import { Transfer } from '../transfer/transfer.entity';
import { Material } from '../material/material.entity';
import { Comment } from '../comment/comment.entity';
import { Deadline } from '../deadline/deadline.entity';

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNo: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.PENDING,
  })
  status: WorkOrderStatus;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, student => student.workOrders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ type: 'uuid' })
  currentConsultantId: string;

  @ManyToOne(() => Consultant)
  @JoinColumn({ name: 'currentConsultantId' })
  currentConsultant: Consultant;

  @Column({ type: 'uuid', nullable: true })
  previousConsultantId: string;

  @ManyToOne(() => Consultant)
  @JoinColumn({ name: 'previousConsultantId' })
  previousConsultant: Consultant;

  @Column({ type: 'date', nullable: true })
  expectedDeadline: Date;

  @Column({ type: 'text', nullable: true })
  serviceContent: string;

  @OneToMany(() => Refund, refund => refund.workOrder)
  refunds: Refund[];

  @OneToMany(() => Transfer, transfer => transfer.workOrder)
  transfers: Transfer[];

  @OneToMany(() => Material, material => material.workOrder)
  materials: Material[];

  @OneToMany(() => Comment, comment => comment.workOrder)
  comments: Comment[];

  @OneToMany(() => Deadline, deadline => deadline.workOrder)
  deadlines: Deadline[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;
}
