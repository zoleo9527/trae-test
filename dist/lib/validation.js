"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNoteSchema = exports.completeMaintenanceSchema = exports.createMaintenanceSchema = exports.settleDepositSchema = exports.resolveDisputeSchema = exports.rejectDisputeSchema = exports.disputeDamageClaimSchema = exports.createDamageClaimSchema = exports.returnRentalSchema = exports.createRentalSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, '用户名不能为空'),
    password: zod_1.z.string().min(1, '密码不能为空'),
});
exports.createRentalSchema = zod_1.z.object({
    instrumentId: zod_1.z.string().min(1, '乐器ID不能为空'),
    customerName: zod_1.z.string().min(1, '客户姓名不能为空'),
    customerPhone: zod_1.z.string().min(11, '手机号格式不正确'),
    customerIdCard: zod_1.z.string().optional(),
    customerAddress: zod_1.z.string().optional(),
    startDate: zod_1.z.coerce.date(),
    expectedEndDate: zod_1.z.coerce.date(),
    dailyRate: zod_1.z.coerce.number().min(0, '日租金不能为负'),
    depositAmount: zod_1.z.coerce.number().min(0, '押金不能为负'),
    isSchoolCooperation: zod_1.z.boolean().default(false),
    schoolContractNo: zod_1.z.string().optional(),
});
exports.returnRentalSchema = zod_1.z.object({
    actualEndDate: zod_1.z.coerce.date().optional(),
    hasDamage: zod_1.z.boolean().default(false),
});
exports.createDamageClaimSchema = zod_1.z.object({
    rentalId: zod_1.z.string().min(1, '租赁单ID不能为空'),
    instrumentId: zod_1.z.string().min(1, '乐器ID不能为空'),
    severity: zod_1.z.enum(['MINOR', 'MODERATE', 'MAJOR', 'TOTAL']),
    description: zod_1.z.string().min(1, '损坏描述不能为空'),
    estimatedCost: zod_1.z.coerce.number().min(0, '预估费用不能为负'),
    evidenceUrls: zod_1.z.array(zod_1.z.string()).default([]),
    finalCost: zod_1.z.coerce.number().min(0, '最终赔偿金额不能为负').optional(),
});
exports.disputeDamageClaimSchema = zod_1.z.object({
    disputeReason: zod_1.z.string().min(1, '申诉理由不能为空'),
});
exports.rejectDisputeSchema = zod_1.z.object({
    rejectReason: zod_1.z.string().min(1, '驳回原因不能为空'),
    finalCost: zod_1.z.coerce.number().min(0, '最终赔偿金额不能为负'),
});
exports.resolveDisputeSchema = zod_1.z.object({
    resolvedReason: zod_1.z.string().min(1, '申诉通过原因不能为空'),
    finalCost: zod_1.z.coerce.number().min(0, '最终赔偿金额不能为负'),
});
exports.settleDepositSchema = zod_1.z.object({
    refundAmount: zod_1.z.coerce.number().min(0, '退款金额不能为负'),
    deductAmount: zod_1.z.coerce.number().min(0, '扣款金额不能为负'),
    paymentMethod: zod_1.z.string().optional(),
    transactionId: zod_1.z.string().optional(),
});
exports.createMaintenanceSchema = zod_1.z.object({
    instrumentId: zod_1.z.string().min(1, '乐器ID不能为空'),
    damageClaimId: zod_1.z.string().optional(),
    description: zod_1.z.string().min(1, '维修描述不能为空'),
    partsCost: zod_1.z.coerce.number().min(0, '配件费不能为负').default(0),
    laborCost: zod_1.z.coerce.number().min(0, '人工费不能为负').default(0),
    startDate: zod_1.z.coerce.date().optional(),
});
exports.completeMaintenanceSchema = zod_1.z.object({
    partsCost: zod_1.z.coerce.number().min(0, '配件费不能为负'),
    laborCost: zod_1.z.coerce.number().min(0, '人工费不能为负'),
    completeDate: zod_1.z.coerce.date().optional(),
});
exports.addNoteSchema = zod_1.z.object({
    entityType: zod_1.z.enum(['RENTAL', 'DEPOSIT', 'DAMAGE_CLAIM', 'MAINTENANCE']),
    entityId: zod_1.z.string().min(1, '实体ID不能为空'),
    content: zod_1.z.string().min(1, '备注内容不能为空'),
    isSupplement: zod_1.z.boolean().default(false),
    supplementReason: zod_1.z.string().optional(),
});
