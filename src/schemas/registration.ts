import { z } from 'zod';
import { withPagination } from './common';

export const createRegistrationSchema = z.object({
  activityId: z.string().min(1, '活动ID不能为空'),
  userName: z.string().min(1, '姓名不能为空'),
  userPhone: z.string().min(11, '手机号格式不正确'),
  idCardNumber: z.string().optional(),
});

export const rejectRegistrationSchema = z.object({
  rejectReason: z.string().min(1, '驳回原因不能为空'),
});

export const supplementRegistrationSchema = z.object({
  activityId: z.string().min(1, '活动ID不能为空'),
  userId: z.string().min(1, '用户ID不能为空'),
  userName: z.string().min(1, '姓名不能为空'),
  userPhone: z.string().min(11, '手机号格式不正确'),
  idCardNumber: z.string().optional(),
  supplementReason: z.string().min(1, '补录原因不能为空'),
});

export const registrationFilterSchema = z.object({
  activityId: z.string().optional(),
  status: z.string().optional(),
  keyword: z.string().optional(),
});

export const registrationListQuerySchema = withPagination(registrationFilterSchema);

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type RejectRegistrationInput = z.infer<typeof rejectRegistrationSchema>;
export type SupplementRegistrationInput = z.infer<typeof supplementRegistrationSchema>;
export type RegistrationFilterInput = z.infer<typeof registrationFilterSchema>;
export type RegistrationListQueryInput = z.infer<typeof registrationListQuerySchema>;
