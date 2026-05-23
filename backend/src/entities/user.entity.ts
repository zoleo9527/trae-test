import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserRole } from '../common/enums/role.enum';
import { WorkOrder } from './work-order.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.INSPECTION_ENGINEER,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  station: string;

  @OneToMany(() => WorkOrder, workOrder => workOrder.reporter)
  reportedOrders: WorkOrder[];

  @OneToMany(() => WorkOrder, workOrder => workOrder.handler)
  handledOrders: WorkOrder[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
