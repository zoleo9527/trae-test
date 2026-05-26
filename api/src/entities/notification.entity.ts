import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum NotificationType {
  INSTALLATION_REMINDER = 'installation_reminder',
  ACCEPTANCE_PENDING = 'acceptance_pending',
  EXCEPTION_ALERT = 'exception_alert',
  SAMPLE_OVERDUE = 'sample_overdue',
  REPAIR_PART_UPDATE = 'repair_part_update',
  ORDER_STATUS_CHANGE = 'order_status_change',
  TASK_ASSIGNMENT = 'task_assignment',
  CUSTOMER_FOLLOWUP = 'customer_followup',
}

export enum NotificationChannel {
  SYSTEM = 'system',
  SMS = 'sms',
  WECHAT = 'wechat',
  EMAIL = 'email',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'simple-enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'simple-enum',
    enum: NotificationChannel,
    default: NotificationChannel.SYSTEM,
  })
  channel: NotificationChannel;

  @Column({
    type: 'simple-enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  recipientRole: string;

  @Column({ nullable: true })
  recipientName: string;

  @Column({ nullable: true })
  relatedOrderId: number;

  @Column({ nullable: true })
  relatedEntityType: string;

  @Column({ nullable: true })
  relatedEntityId: number;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'datetime', nullable: true })
  readAt: Date;

  @Column({ type: 'datetime', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'datetime', nullable: true })
  sentAt: Date;

  @Column({ type: 'text', nullable: true })
  actionUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
