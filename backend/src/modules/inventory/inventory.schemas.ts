import { z } from 'zod';
import { InventoryLockStatus } from '../../types/enums';

export const createPartSchema = z.object({
  sku: z.string().min(2, 'SKU至少2个字符'),
  name: z.string().min(2, '配件名称不能为空'),
  category: z.string().min(1, '分类不能为空'),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  specification: z.string().optional().nullable(),
  unit: z.string().min(1, '单位不能为空'),
  unitPrice: z.number().positive('单价必须大于0'),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

export const updatePartSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().min(1).optional(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  specification: z.string().optional().nullable(),
  unit: z.string().min(1).optional(),
  unitPrice: z.number().positive().optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createInventorySchema = z.object({
  partId: z.string().uuid(),
  warehouse: z.string().default('MAIN'),
  location: z.string().optional().nullable(),
  quantity: z.number().int().nonnegative('库存数量不能为负'),
  minStock: z.number().int().nonnegative().default(0),
  maxStock: z.number().int().positive().optional().nullable(),
  batchNo: z.string().optional().nullable(),
  expireDate: z.string().optional().nullable(),
});

export const updateInventorySchema = z.object({
  quantity: z.number().int().nonnegative().optional(),
  location: z.string().optional().nullable(),
  minStock: z.number().int().nonnegative().optional(),
  maxStock: z.number().int().positive().optional().nullable(),
});

export const lockInventorySchema = z.object({
  inventoryId: z.string().uuid(),
  quantity: z.number().int().positive('锁定数量必须大于0'),
  reason: z.string().min(1, '锁定原因不能为空'),
  applicationId: z.string().uuid().optional(),
  applicationItemId: z.string().uuid().optional(),
  repairOrderId: z.string().uuid().optional(),
  durationHours: z.number().int().min(1).max(24).optional().default(4),
});

export const unlockInventorySchema = z.object({
  reason: z.string().optional(),
});

export const partIdSchema = z.object({
  id: z.string().uuid('配件ID格式不正确'),
});

export const inventoryIdSchema = z.object({
  id: z.string().uuid('库存ID格式不正确'),
});

export const lockIdSchema = z.object({
  id: z.string().uuid('锁定ID格式不正确'),
});

export const partQuerySchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  keyword: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const inventoryQuerySchema = z.object({
  partId: z.string().uuid().optional(),
  warehouse: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  includeLocks: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const lockQuerySchema = z.object({
  status: z.nativeEnum(InventoryLockStatus).optional(),
  inventoryId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  repairOrderId: z.string().uuid().optional(),
  lockedBy: z.string().uuid().optional(),
  expired: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});
