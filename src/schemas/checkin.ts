import { z } from 'zod';
import { withPagination } from './common';

export const createCheckInSchema = z.object({
  activityId: z.string().min(1, '活动ID不能为空'),
  registrationId: z.string().min(1, '报名记录ID不能为空'),
  checkInMethod: z.enum(['QR_CODE', 'MANUAL', 'AUTO']),
  evidenceImage: z.string().optional(),
  manualRemark: z.string().optional(),
});

export const manualCheckInSchema = z.object({
  activityId: z.string().min(1, '活动ID不能为空'),
  registrationId: z.string().min(1, '报名记录ID不能为空'),
  manualRemark: z.string().min(1, '人工签到备注不能为空'),
  evidenceImage: z.string().optional(),
});

export const checkInFilterSchema = z.object({
  activityId: z.string().optional(),
  status: z.string().optional(),
  keyword: z.string().optional(),
});

export const checkInListQuerySchema = withPagination(checkInFilterSchema);

export type CreateCheckInInput = z.infer<typeof createCheckInSchema>;
export type ManualCheckInInput = z.infer<typeof manualCheckInSchema>;
export type CheckInFilterInput = z.infer<typeof checkInFilterSchema>;
export type CheckInListQueryInput = z.infer<typeof checkInListQuerySchema>;
