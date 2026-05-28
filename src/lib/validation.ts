import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
})

export const createRentalSchema = z.object({
  instrumentId: z.string().min(1, '乐器ID不能为空'),
  customerName: z.string().min(1, '客户姓名不能为空'),
  customerPhone: z.string().min(11, '手机号格式不正确'),
  customerIdCard: z.string().optional(),
  customerAddress: z.string().optional(),
  startDate: z.coerce.date(),
  expectedEndDate: z.coerce.date(),
  dailyRate: z.coerce.number().min(0, '日租金不能为负'),
  depositAmount: z.coerce.number().min(0, '押金不能为负'),
  checkoutNotes: z.string().optional(),
})

export const returnRentalSchema = z.object({
  rentalId: z.string().min(1, '租赁单ID不能为空'),
  actualEndDate: z.coerce.date().optional(),
  checkinNotes: z.string().optional(),
  hasDamage: z.boolean().default(false),
})

export const createDamageClaimSchema = z.object({
  rentalId: z.string().min(1, '租赁单ID不能为空'),
  instrumentId: z.string().min(1, '乐器ID不能为空'),
  severity: z.enum(['MINOR', 'MODERATE', 'MAJOR', 'TOTAL']),
  description: z.string().min(1, '损坏描述不能为空'),
  estimatedCost: z.coerce.number().min(0, '预估费用不能为负'),
  evidenceUrls: z.array(z.string()).default([]),
  liabilityParty: z.string().optional(),
  liabilityReason: z.string().optional(),
})

export const disputeDamageClaimSchema = z.object({
  claimId: z.string().min(1, '申诉单ID不能为空'),
  disputeReason: z.string().min(1, '申诉理由不能为空'),
})

export const rejectDisputeSchema = z.object({
  claimId: z.string().min(1, '申诉单ID不能为空'),
  rejectReason: z.string().min(1, '驳回原因不能为空'),
  finalCost: z.coerce.number().min(0, '最终赔偿金额不能为负'),
})

export const resolveDisputeSchema = z.object({
  claimId: z.string().min(1, '申诉单ID不能为空'),
  resolvedReason: z.string().min(1, '申诉通过原因不能为空'),
  finalCost: z.coerce.number().min(0, '最终赔偿金额不能为负'),
  liabilityParty: z.string().optional(),
  liabilityReason: z.string().optional(),
})

export const settleDepositSchema = z.object({
  depositId: z.string().min(1, '押金单ID不能为空'),
  refundAmount: z.coerce.number().min(0, '退款金额不能为负'),
  deductAmount: z.coerce.number().min(0, '扣款金额不能为负'),
  deductReason: z.string().optional(),
})

export const createMaintenanceSchema = z.object({
  instrumentId: z.string().min(1, '乐器ID不能为空'),
  damageClaimId: z.string().optional(),
  type: z.string().min(1, '维修类型不能为空'),
  description: z.string().min(1, '维修描述不能为空'),
  partsCost: z.coerce.number().min(0, '配件费不能为负').default(0),
  laborCost: z.coerce.number().min(0, '人工费不能为负').default(0),
  startedAt: z.coerce.date().optional(),
})

export const completeMaintenanceSchema = z.object({
  maintenanceId: z.string().min(1, '维修单ID不能为空'),
  partsCost: z.coerce.number().min(0, '配件费不能为负'),
  laborCost: z.coerce.number().min(0, '人工费不能为负'),
  technicianNotes: z.string().optional(),
  completedAt: z.coerce.date().optional(),
})

export const addNoteSchema = z.object({
  entityType: z.enum(['RENTAL', 'DEPOSIT', 'DAMAGE_CLAIM', 'MAINTENANCE']),
  entityId: z.string().min(1, '实体ID不能为空'),
  content: z.string().min(1, '备注内容不能为空'),
  isSupplement: z.boolean().default(false),
  supplementReason: z.string().optional(),
})
