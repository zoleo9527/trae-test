import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { NotificationType, NotificationChannel, NotificationPriority } from '../../entities/notification.entity';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  recipientRole?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsNumber()
  relatedOrderId?: number;

  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @IsOptional()
  @IsNumber()
  relatedEntityId?: number;

  @IsOptional()
  @IsString()
  actionUrl?: string;
}

export class MarkReadDto {
  @IsBoolean()
  isRead: boolean;
}
