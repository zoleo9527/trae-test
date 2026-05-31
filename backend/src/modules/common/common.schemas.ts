import { z } from 'zod';

export const exportQuerySchema = z.object({
  type: z.enum(['repair-orders', 'part-applications', 'inventory', 'operation-logs']),
  format: z.enum(['csv', 'json']).default('csv'),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const operationLogQuerySchema = z.object({
  traceId: z.string().optional(),
  module: z.string().optional(),
  operation: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  userId: z.string().uuid().optional(),
  isSuccess: z.coerce.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const traceIdSchema = z.object({
  traceId: z.string('链路追踪ID不能为空'),
});
