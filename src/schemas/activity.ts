import { z } from 'zod';

export const createActivitySchema = z.object({
  title: z.string().min(1, '活动标题不能为空'),
  description: z.string().min(1, '活动描述不能为空'),
  libraryId: z.string().min(1, '书房ID不能为空'),
  location: z.string().min(1, '活动地点不能为空'),
  maxParticipants: z.number().int().min(1, '最大参与人数至少1人'),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  registrationStart: z.coerce.date(),
  registrationEnd: z.coerce.date(),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).default([]),
  requirements: z.string().optional(),
  notes: z.string().optional(),
});

export const updateActivitySchema = createActivitySchema.partial();

export const activityFilterSchema = z.object({
  libraryId: z.string().optional(),
  status: z.string().optional(),
  keyword: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ActivityFilterInput = z.infer<typeof activityFilterSchema>;
