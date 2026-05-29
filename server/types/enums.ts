// ==========================================
// 应用层枚举定义
// 由于SQLite不支持原生enum，数据库用String存储
// 业务逻辑层用TS枚举做类型安全校验
// ==========================================

export enum Role {
  STORE_OWNER = 'STORE_OWNER',
  SALES = 'SALES',
  WAREHOUSE = 'WAREHOUSE',
}

export enum InquiryStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  QUOTED = 'QUOTED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum StockLockStatus {
  PENDING = 'PENDING',
  LOCKED = 'LOCKED',
  RELEASED = 'RELEASED',
  SOLD = 'SOLD',
}

export enum ReturnStatus {
  PENDING_IDENTIFY = 'PENDING_IDENTIFY',
  IDENTIFYING = 'IDENTIFYING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REWORK = 'REWORK',
  COMPLETED = 'COMPLETED',
}

export enum RefundStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
}

export enum OperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REWORK = 'REWORK',
  CANCEL = 'CANCEL',
  LOCK = 'LOCK',
  UNLOCK = 'UNLOCK',
  INSPECT = 'INSPECT',
  PAY = 'PAY',
  ADD_REMARK = 'ADD_REMARK',
  UPLOAD_EVIDENCE = 'UPLOAD_EVIDENCE',
  EXPORT = 'EXPORT',
}

export enum ExceptionType {
  WRONG_PART = 'WRONG_PART',
  NO_EVIDENCE = 'NO_EVIDENCE',
  PAYMENT_DELAY = 'PAYMENT_DELAY',
  PRICE_DISPUTE = 'PRICE_DISPUTE',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  LOST_DAMAGE = 'LOST_DAMAGE',
  OTHER = 'OTHER',
}

export enum EvidenceType {
  PHOTO = 'PHOTO',
  RECEIPT = 'RECEIPT',
  CHAT_RECORD = 'CHAT_RECORD',
  INVOICE = 'INVOICE',
  INSPECTION_REPORT = 'INSPECTION_REPORT',
  OTHER = 'OTHER',
}

export const RoleLabel: Record<Role, string> = {
  [Role.STORE_OWNER]: '门店老板',
  [Role.SALES]: '配件销售',
  [Role.WAREHOUSE]: '库管',
};

export const InquiryStatusLabel: Record<InquiryStatus, string> = {
  [InquiryStatus.DRAFT]: '草稿',
  [InquiryStatus.PENDING]: '待报价',
  [InquiryStatus.QUOTED]: '已报价',
  [InquiryStatus.CONFIRMED]: '已确认',
  [InquiryStatus.CANCELLED]: '已取消',
  [InquiryStatus.COMPLETED]: '已完成',
};

export const StockLockStatusLabel: Record<StockLockStatus, string> = {
  [StockLockStatus.PENDING]: '待确认',
  [StockLockStatus.LOCKED]: '已锁库',
  [StockLockStatus.RELEASED]: '已释放',
  [StockLockStatus.SOLD]: '已出库',
};

export const ReturnStatusLabel: Record<ReturnStatus, string> = {
  [ReturnStatus.PENDING_IDENTIFY]: '待鉴定',
  [ReturnStatus.IDENTIFYING]: '鉴定中',
  [ReturnStatus.APPROVED]: '鉴定通过',
  [ReturnStatus.REJECTED]: '鉴定驳回',
  [ReturnStatus.REWORK]: '需补录',
  [ReturnStatus.COMPLETED]: '退货完成',
};

export const RefundStatusLabel: Record<RefundStatus, string> = {
  [RefundStatus.PENDING_REVIEW]: '待复核',
  [RefundStatus.REVIEWING]: '复核中',
  [RefundStatus.APPROVED]: '复核通过',
  [RefundStatus.REJECTED]: '复核驳回',
  [RefundStatus.PAID]: '已打款',
  [RefundStatus.FAILED]: '打款失败',
  [RefundStatus.COMPLETED]: '退款完成',
};

export const ExceptionTypeLabel: Record<ExceptionType, string> = {
  [ExceptionType.WRONG_PART]: '配件型号错误',
  [ExceptionType.NO_EVIDENCE]: '退货无据',
  [ExceptionType.PAYMENT_DELAY]: '回款拖欠',
  [ExceptionType.PRICE_DISPUTE]: '价格争议',
  [ExceptionType.QUALITY_ISSUE]: '质量问题',
  [ExceptionType.LOST_DAMAGE]: '丢失损坏',
  [ExceptionType.OTHER]: '其他异常',
};

export const EvidenceTypeLabel: Record<EvidenceType, string> = {
  [EvidenceType.PHOTO]: '照片',
  [EvidenceType.RECEIPT]: '收据/小票',
  [EvidenceType.CHAT_RECORD]: '聊天记录',
  [EvidenceType.INVOICE]: '发票',
  [EvidenceType.INSPECTION_REPORT]: '检测报告',
  [EvidenceType.OTHER]: '其他凭证',
};
