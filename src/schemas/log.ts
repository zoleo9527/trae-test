import { z } from 'zod';
import { withPagination } from './common';

export const logFilterSchema = z.object({
  module: z.string().optional(),
  action: z.string().optional(),
  recordId: z.string().optional(),
  recordType: z.string().optional(),
  keyword: z.string().optional(),
});

export const logListQuerySchema = withPagination(logFilterSchema);

export type LogFilterInput = z.infer<typeof logFilterSchema>;
export type LogListQueryInput = z.infer<typeof logListQuerySchema>;
