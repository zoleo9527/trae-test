import { z } from 'zod';
import {
  Role,
  InquiryStatus,
  StockLockStatus,
  ReturnStatus,
  RefundStatus,
  ExceptionType,
  EvidenceType,
} from './enums';

// ==========================================
// 通用 DTO
// ==========================================

export const QueryFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  keyword: z.string().optional(),
  status: z.union([z.string(), z.array(z.string())]).optional().transform(v => {
    if (Array.isArray(v)) return v;
    return v ? [v] : undefined;
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasException: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
});

export type QueryFilterDto = z.infer<typeof QueryFilterSchema>;

// ==========================================
// 认证 DTO
// ==========================================

export const LoginSchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(6).max(50),
});

export type LoginDto = z.infer<typeof LoginSchema>;

// ==========================================
// 询价单 DTO
// ==========================================

export const InquiryItemCreateSchema = z.object({
  partId: z.string().uuid(),
  partName: z.string(),
  partCode: z.string(),
  quantity: z.number().int().min(1),
  quotedPrice: z.number().min(0).optional(),
  remark: z.string().optional(),
});

export const InquiryCreateSchema = z.object({
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().optional(),
  carModel: z.string().optional(),
  vinNo: z.string().optional(),
  expectedDate: z.string().optional(),
  isUrgent: z.boolean().default(false),
  items: z.array(InquiryItemCreateSchema).min(1),
  idempotencyKey: z.string().optional(),
});

export const InquiryUpdateSchema = z.object({
  customerName: z.string().min(1).max(100).optional(),
  customerPhone: z.string().optional(),
  carModel: z.string().optional(),
  vinNo: z.string().optional(),
  expectedDate: z.string().optional(),
  isUrgent: z.boolean().optional(),
  items: z.array(InquiryItemCreateSchema).min(1).optional(),
  rejectReason: z.string().optional(),
  supplementNote: z.string().optional(),
  hasException: z.boolean().optional(),
  exceptionType: z.nativeEnum(ExceptionType).optional(),
  exceptionNote: z.string().optional(),
});

export const InquiryStatusUpdateSchema = z.object({
  status: z.nativeEnum(InquiryStatus),
  rejectReason: z.string().optional(),
  remark: z.string().optional(),
});

export type InquiryCreateDto = z.infer<typeof InquiryCreateSchema>;
export type InquiryUpdateDto = z.infer<typeof InquiryUpdateSchema>;
export type InquiryStatusUpdateDto = z.infer<typeof InquiryStatusUpdateSchema>;

// ==========================================
// 锁库单 DTO
// ==========================================

export const StockLockItemCreateSchema = z.object({
  partId: z.string().uuid(),
  partName: z.string(),
  partCode: z.string(),
  quantity: z.number().int().min(1),
  location: z.string().optional(),
});

export const StockLockCreateSchema = z.object({
  inquiryId: z.string().uuid(),
  validUntil: z.string().optional(),
  warehouseNote: z.string().optional(),
  items: z.array(StockLockItemCreateSchema).min(1),
  idempotencyKey: z.string().optional(),
});

export const StockLockUpdateSchema = z.object({
  validUntil: z.string().optional(),
  warehouseNote: z.string().optional(),
  rejectReason: z.string().optional(),
  items: z.array(StockLockItemCreateSchema).min(1).optional(),
});

export const StockLockStatusUpdateSchema = z.object({
  status: z.nativeEnum(StockLockStatus),
  rejectReason: z.string().optional(),
  remark: z.string().optional(),
});

export type StockLockCreateDto = z.infer<typeof StockLockCreateSchema>;
export type StockLockUpdateDto = z.infer<typeof StockLockUpdateSchema>;
export type StockLockStatusUpdateDto = z.infer<typeof StockLockStatusUpdateSchema>;

// ==========================================
// 退货鉴定单 DTO
// ==========================================

export const ReturnItemCreateSchema = z.object({
  partId: z.string().uuid(),
  partName: z.string(),
  partCode: z.string(),
  returnQuantity: z.number().int().min(1),
  originalQuantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  inspectionResult: z.string().optional(),
  inspectionNote: z.string().optional(),
});

export const ReturnOrderCreateSchema = z.object({
  inquiryId: z.string().uuid(),
  returnReason: z.string().min(1),
  returnDate: z.string().optional(),
  originalSalesDate: z.string().optional(),
  originalAmount: z.number().min(0),
  applyRefundAmount: z.number().min(0),
  items: z.array(ReturnItemCreateSchema).min(1),
  supplementNote: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export const ReturnOrderUpdateSchema = z.object({
  returnReason: z.string().min(1).optional(),
  originalSalesDate: z.string().optional(),
  applyRefundAmount: z.number().min(0).optional(),
  identifyResult: z.string().optional(),
  rejectReason: z.string().optional(),
  supplementNote: z.string().optional(),
  reworkNote: z.string().optional(),
  hasException: z.boolean().optional(),
  exceptionType: z.nativeEnum(ExceptionType).optional(),
  exceptionNote: z.string().optional(),
  items: z.array(ReturnItemCreateSchema).min(1).optional(),
});

export const ReturnStatusUpdateSchema = z.object({
  status: z.nativeEnum(ReturnStatus),
  identifyResult: z.string().optional(),
  rejectReason: z.string().optional(),
  reworkNote: z.string().optional(),
  remark: z.string().optional(),
});

export const ReturnItemInspectSchema = z.object({
  inspectionResult: z.string(),
  inspectionNote: z.string().optional(),
  inspected: z.boolean().default(true),
});

export type ReturnOrderCreateDto = z.infer<typeof ReturnOrderCreateSchema>;
export type ReturnOrderUpdateDto = z.infer<typeof ReturnOrderUpdateSchema>;
export type ReturnStatusUpdateDto = z.infer<typeof ReturnStatusUpdateSchema>;
export type ReturnItemInspectDto = z.infer<typeof ReturnItemInspectSchema>;

// ==========================================
// 退款复核单 DTO
// ==========================================

export const RefundOrderCreateSchema = z.object({
  returnOrderId: z.string().uuid(),
  inquiryId: z.string().uuid(),
  refundAmount: z.number().min(0),
  isCreditCustomer: z.boolean().default(false),
  dueDate: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export const RefundOrderUpdateSchema = z.object({
  refundAmount: z.number().min(0).optional(),
  actualRefundAmount: z.number().min(0).optional(),
  paymentMethod: z.string().optional(),
  paymentTraceNo: z.string().optional(),
  reviewResult: z.string().optional(),
  rejectReason: z.string().optional(),
  supplementNote: z.string().optional(),
  isCreditCustomer: z.boolean().optional(),
  dueDate: z.string().optional(),
  hasDelay: z.boolean().optional(),
  delayDays: z.number().int().min(0).optional(),
  hasException: z.boolean().optional(),
  exceptionType: z.nativeEnum(ExceptionType).optional(),
  exceptionNote: z.string().optional(),
});

export const RefundStatusUpdateSchema = z.object({
  status: z.nativeEnum(RefundStatus),
  reviewResult: z.string().optional(),
  rejectReason: z.string().optional(),
  actualRefundAmount: z.number().min(0).optional(),
  paymentMethod: z.string().optional(),
  paymentTraceNo: z.string().optional(),
  remark: z.string().optional(),
});

export type RefundOrderCreateDto = z.infer<typeof RefundOrderCreateSchema>;
export type RefundOrderUpdateDto = z.infer<typeof RefundOrderUpdateSchema>;
export type RefundStatusUpdateDto = z.infer<typeof RefundStatusUpdateSchema>;

// ==========================================
// 通用状态更新 DTO
// ==========================================

export const StatusUpdateSchema = z.object({
  status: z.string(),
  rejectReason: z.string().optional(),
  remark: z.string().optional(),
});

export type StatusUpdateDto = z.infer<typeof StatusUpdateSchema>;

// ==========================================
// 备注 DTO
// ==========================================

export const RemarkAddSchema = z.object({
  content: z.string().min(1),
  isImportant: z.boolean().default(false),
});

export const RemarkCreateSchema = RemarkAddSchema;

export type RemarkCreateDto = z.infer<typeof RemarkCreateSchema>;
export type RemarkAddDto = z.infer<typeof RemarkAddSchema>;

// ==========================================
// 导出 DTO
// ==========================================

export const ExportSchema = z.object({
  format: z.enum(['xlsx', 'csv']).default('xlsx'),
  type: z.enum(['inquiry', 'stockLock', 'returnOrder', 'refundOrder']),
  status: z.array(z.string()).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasException: z.boolean().optional(),
  keyword: z.string().optional(),
});

export type ExportDto = z.infer<typeof ExportSchema>;
