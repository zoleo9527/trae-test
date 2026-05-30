import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export function withPagination<T extends z.ZodRawShape>(filterSchema: z.ZodObject<T>) {
  return paginationSchema.merge(filterSchema);
}

export const queryBoolean = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === 'true'));

export type PaginationInput = z.infer<typeof paginationSchema>;
