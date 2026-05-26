import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationChannel, NotificationPriority } from '../../entities/notification.entity';
import { CreateNotificationDto } from './notification.dto';
import { createPaginatedResult, PaginatedResult, PaginationParams } from '../../common/pagination';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAll(
    pagination: PaginationParams,
    isRead?: boolean,
    recipientRole?: string,
    recipientName?: string,
  ): Promise<PaginatedResult<Notification>> {
    const where: any = {};
    if (isRead !== undefined) {
      where.isRead = isRead;
    }
    if (recipientRole) {
      where.recipientRole = recipientRole;
    }
    if (recipientName) {
      where.recipientName = recipientName;
    }

    const [items, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC', priority: 'DESC' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: number): Promise<Notification> {
    return this.notificationRepository.findOneBy({ id });
  }

  async getUnreadCount(recipientRole?: string, recipientName?: string): Promise<number> {
    const where: any = { isRead: false };
    if (recipientRole) {
      where.recipientRole = recipientRole;
    }
    if (recipientName) {
      where.recipientName = recipientName;
    }
    return this.notificationRepository.count({ where });
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(dto);
    return this.notificationRepository.save(notification);
  }

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(recipientRole?: string, recipientName?: string): Promise<void> {
    const where: any = { isRead: false };
    if (recipientRole) {
      where.recipientRole = recipientRole;
    }
    if (recipientName) {
      where.recipientName = recipientName;
    }
    await this.notificationRepository.update(where, { isRead: true, readAt: new Date() });
  }

  async createTaskReminder(
    title: string,
    content: string,
    recipientRole: string,
    relatedOrderId?: number,
    relatedEntityType?: string,
    relatedEntityId?: number,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.TASK_ASSIGNMENT,
      channel: NotificationChannel.SYSTEM,
      priority,
      title,
      content,
      recipientRole,
      relatedOrderId,
      relatedEntityType,
      relatedEntityId,
    });
  }

  async getWorkbenchTasks(role: string): Promise<any> {
    const unread = await this.getUnreadCount(role);
    const notifications = await this.notificationRepository.find({
      where: {
        recipientRole: role,
        isRead: false,
      },
      order: { priority: 'DESC', createdAt: 'DESC' },
      take: 10,
    });

    return {
      unreadCount: unread,
      recentTasks: notifications,
    };
  }
}
