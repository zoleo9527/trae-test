import { z } from 'zod';
import { RepairOrderStatus } from '../../types/enums';

export const createRepairOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, '客户姓名不能为空'),
    phone: z.string().min(1, '客户电话不能为空'),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
  }),
  watch: z.object({
    brand: z.string().min(1, '品牌不能为空'),
    model: z.string().min(1, '型号不能为空'),
    serialNumber: z.string().min(1, '序列号不能为空'),
    movementType: z.string().optional().nullable(),
    productionYear: z.number().int().positive().optional().nullable(),
    caseMaterial: z.string().optional().nullable(),
    strapType: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
  }),
  problemDescription: z.string().min(1, '问题描述不能为空'),
  appearanceCondition: z.string().optional().nullable(),
  accessories: z.string().optional().nullable(),
  estimatedCost: z.number().positive().optional().nullable(),
  estimatedDeliveryDate: z.string().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  technician: z.string().uuid().optional().nullable(),
  note: z.string().optional(),
});

export const updateRepairOrderSchema = z.object({
  problemDescription: z.string().min(1).optional(),
  appearanceCondition: z.string().optional().nullable(),
  accessories: z.string().optional().nullable(),
  estimatedCost: z.number().positive().optional().nullable(),
  actualCost: z.number().positive().optional().nullable(),
  estimatedDeliveryDate: z.string().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  technician: z.string().uuid().optional().nullable(),
});

export const changeStatusSchema = z.object({
  status: z.nativeEnum(RepairOrderStatus),
  changeReason: z.string().optional().nullable(),
  note: z.string().optional(),
});

export const quotationSchema = z.object({
  estimatedCost: z.number().positive('报价金额必须大于0'),
  estimatedDeliveryDate: z.string().optional().nullable(),
  description: z.string().optional(),
});

export const customerConfirmSchema = z.object({
  confirmed: z.boolean(),
  rejectReason: z.string().optional().nullable(),
});

export const satisfactionSchema = z.object({
  score: z.number().int().min(1).max(5, '评分范围1-5'),
  note: z.string().optional().nullable(),
});

export const repairOrderIdSchema = z.object({
  id: z.string().uuid('寄修单ID格式不正确'),
});

export const repairOrderQuerySchema = z.object({
  status: z.nativeEnum(RepairOrderStatus).optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  watchBrand: z.string().optional(),
  watchSerial: z.string().optional(),
  receivedBy: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  technician: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const noteSchema = z.object({
  type: z.enum(['SYSTEM', 'CUSTOMER_REPLY', 'INTERNAL', 'REJECT_REASON', 'SUPPLEMENT_INFO', 'FOLLOWUP']),
  content: z.string().min(1, '备注内容不能为空'),
});
