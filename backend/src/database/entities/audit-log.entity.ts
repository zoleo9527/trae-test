import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  STATUS_CHANGE = 'status_change',
  HANDOVER = 'handover',
  APPROVE = 'approve',
  REJECT = 'reject',
  CONFIRM = 'confirm',
  CANCEL = 'cancel',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export enum AuditModule {
  WORK_ORDER = 'work_order',
  REPAIR = 'repair',
  FOLLOW_UP = 'follow_up',
  MEMBER = 'member',
  PRODUCT = 'product',
  USER = 'user',
  SYSTEM = 'system',
}

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column({ type: 'enum', enum: AuditModule })
  module: AuditModule;

  @Column({ type: 'uuid', name: 'record_id' })
  recordId: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'uuid', name: 'operator_id', nullable: true })
  operatorId: string;

  @ManyToOne(() => User, (user) => user.auditLogs)
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @Column({ type: 'varchar', length: 200, name: 'operator_name', nullable: true })
  operatorName: string;

  @Column({ type: 'text', name: 'action_description' })
  actionDescription: string;

  @Column({ type: 'jsonb', name: 'old_values', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', name: 'new_values', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'varchar', length: 100, name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 200, name: 'user_agent', nullable: true })
  userAgent: string;
}
