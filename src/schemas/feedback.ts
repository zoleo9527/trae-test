import { z } from 'zod';
import { withPagination, queryBoolean } from './common';

export const createFeedbackSchema = z.object({
  activityId: z.string().min(1, '活动ID不能为空'),
  content: z.string().min(1, '反馈内容不能为空'),
  rating: z.number().int().min(1).max(5).optional(),
});

export const resolveFeedbackSchema = z.object({
  resolution: z.string().min(1, '处理说明不能为空'),
});

export const feedbackFilterSchema = z.object({
  activityId: z.string().optional(),
  volunteerId: z.string().optional(),
  isResolved: queryBoolean,
  keyword: z.string().optional(),
});

export const feedbackListQuerySchema = withPagination(feedbackFilterSchema);

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type ResolveFeedbackInput = z.infer<typeof resolveFeedbackSchema>;
export type FeedbackFilterInput = z.infer<typeof feedbackFilterSchema>;
