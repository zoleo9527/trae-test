import { z } from 'zod';
import { PartApplicationStatus } from '../../types/enums';

export const applicationItemSchema = z.object({
  partId: z.string().uuid('配件ID格式不正确'),
  requestedQty: z.number().int().positive('申请数量必须大于0'),
  remark: z.string().optional().nullable(),
});

export const createApplicationSchema = z.object({
  repairOrderId: z.string().uuid('寄修单ID格式不正确'),
  title: z.string().min(2, '标题至少2个字符'),
  description: z.string().optional().nullable(),
  urgencyLevel: z.enum(['NORMAL', 'URGENT', 'EMERGENCY']).default('NORMAL'),
  expectedPickupDate: z.string().optional().nullable(),
  items: z
    .array(applicationItemSchema)
    .min(1, '至少需要一个配件明细'),
  note: z.string().optional(),
});

export const updateApplicationSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  urgencyLevel: z.enum(['NORMAL', 'URGENT', 'EMERGENCY']).optional(),
  expectedPickupDate: z.string().optional().nullable(),
  items: z.array(applicationItemSchema).min(1).optional(),
});

export const submitApplicationSchema = z.object({
  note: z.string().optional(),
});

export const approveApplicationSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      approvedQty: z.number().int().nonnegative('批准数量不能为负'),
      remark: z.string().optional().nullable(),
    })
  ).min(1, '必须指定批准明细'),
  note: z.string().optional(),
});

export const rejectApplicationSchema = z.object({
  reason: z.string().min(1, '驳回原因不能为空'),
  note: z.string().optional(),
});

export const supplementApplicationSchema = z.object({
  description: z.string().min(1, '补录说明不能为空'),
  addItems: z.array(applicationItemSchema).optional(),
  updateItems: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        requestedQty: z.number().int().positive(),
        remark: z.string().optional().nullable(),
      })
    )
    .optional(),
});

export const pickupApplicationSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      actualIssuedQty: z.number().int().nonnegative('实际发放数量不能为负'),
      unitPrice: z.number().positive('单价必须大于0').optional(),
    })
  ).min(1, '必须指定发放明细'),
  note: z.string().optional(),
});

export const applicationIdSchema = z.object({
  id: z.string().uuid('申请单ID格式不正确'),
});

export const applicationQuerySchema = z.object({
  status: z.nativeEnum(PartApplicationStatus).optional(),
  repairOrderId: z.string().uuid().optional(),
  urgencyLevel: z.enum(['NORMAL', 'URGENT', 'EMERGENCY']).optional(),
  createdBy: z.string().uuid().optional(),
  approvedBy: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const addNoteSchema = z.object({
  type: z.enum(['SYSTEM', 'CUSTOMER_REPLY', 'INTERNAL', 'REJECT_REASON', 'SUPPLEMENT', 'FOLLOWUP']),
  content: z.string().min(1, '备注内容不能为空'),
});
