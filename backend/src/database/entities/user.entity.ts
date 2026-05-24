import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { WorkOrder } from './work-order.entity';
import { AuditLog } from './audit-log.entity';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES = 'sales',
  WORKSHOP = 'workshop',
  CUSTOMER_SERVICE = 'customer_service',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 50, name: 'real_name' })
  realName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.SALES,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.handler)
  handledOrders: WorkOrder[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.operator)
  auditLogs: AuditLog[];
}
