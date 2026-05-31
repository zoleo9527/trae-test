import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  STATUS_CHANGE = 'status_change',
  SIGN_OFF = 'sign_off',
  SIGN_OFF_REJECT = 'sign_off_reject',
  VERSION_CREATE = 'version_create',
  EXPORT = 'export',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export enum AuditEntityType {
  USER = 'user',
  CHANGE_ORDER = 'change_order',
  DAILY_REPORT = 'daily_report',
  DELIVERY = 'delivery',
  SIGN_OFF = 'sign_off',
}

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['action'])
@Index(['userId'])
@Index(['createdAt'])
export class AuditLog extends BaseEntity {
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditEntityType,
    name: 'entity_type',
  })
  entityType: AuditEntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'entity_name', nullable: true })
  entityName?: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'user_name', nullable: true })
  userName?: string;

  @Column({ name: 'user_role', nullable: true })
  userRole?: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ type: 'jsonb', name: 'old_values', nullable: true })
  oldValues?: Record<string, any>;

  @Column({ type: 'jsonb', name: 'new_values', nullable: true })
  newValues?: Record<string, any>;

  @Column({ type: 'jsonb', name: 'changed_fields', nullable: true })
  changedFields?: string[];

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
