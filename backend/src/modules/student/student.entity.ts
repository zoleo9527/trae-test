import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { WorkOrder } from '../work-order/work-order.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  englishName: string;

  @Column({ unique: true })
  phone: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  targetCountry: string;

  @Column({ nullable: true })
  targetSchool: string;

  @Column({ nullable: true })
  targetMajor: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @OneToMany(() => WorkOrder, workOrder => workOrder.student)
  workOrders: WorkOrder[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
