import { z } from 'zod';
import { withPagination, queryBoolean } from './common';

export const sendNotificationSchema = z.object({
  type: z.enum([
    'REGISTRATION_APPROVED',
    'REGISTRATION_REJECTED',
    'ACTIVITY_REMINDER',
    'CHECK_IN_SUCCESS',
    'VOLUNTEER_FEEDBACK',
    'SYSTEM_ALERT',
  ]),
  title: z.string().min(1, '标题不能为空'),
  content: z.string().min(1, '内容不能为空'),
  recipientId: z.string().min(1, '接收人ID不能为空'),
  recipientPhone: z.string().optional(),
  relatedRecordId: z.string().optional(),
  relatedRecordType: z.string().optional(),
});

export const notificationFilterSchema = z.object({
  type: z.string().optional(),
  isRead: queryBoolean,
  isSent: queryBoolean,
  recipientId: z.string().optional(),
  keyword: z.string().optional(),
});

export const notificationListQuerySchema = withPagination(notificationFilterSchema);

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;
