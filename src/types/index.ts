export type UserRole = 'owner' | 'weigher' | 'accountant';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export type Category = 'paper' | 'plastic' | 'metal' | 'glass' | 'electronics';

export type LedgerStatus = 'pending' | 'verified' | 'reconciled' | 'settled';

export interface LedgerRecord {
  id: string;
  recordNo: string;
  category: Category;
  weight: number;
  unitPrice: number;
  totalAmount: number;
  weigherId: string;
  weigherName: string;
  supplier: string;
  weightPhoto: string;
  yardPhoto?: string;
  status: LedgerStatus;
  createdAt: string;
  verifiedAt?: string;
  reconciledAt?: string;
  settledAt?: string;
  remarks: Comment[];
  operationLogs: OperationLog[];
}

export type ExceptionStatus = 'pending' | 'processing' | 'resolved' | 'rejected' | 'closed';

export type ExceptionType = 'environment' | 'equipment' | 'quality' | 'safety';

export interface ExceptionRecord {
  id: string;
  exceptionNo: string;
  type: ExceptionType;
  title: string;
  description: string;
  photos: string[];
  reporterId: string;
  reporterName: string;
  handlerId?: string;
  handlerName?: string;
  status: ExceptionStatus;
  relatedLedgerId?: string;
  createdAt: string;
  updatedAt: string;
  processingAt?: string;
  resolvedAt?: string;
  comments: Comment[];
  operationLogs: OperationLog[];
}

export interface PriceChange {
  id: string;
  category: Category;
  oldPrice: number;
  newPrice: number;
  effectiveDate: string;
  reason: string;
  applicantId: string;
  applicantName: string;
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  comments: Comment[];
}

export type FinanceType = 'receivable' | 'payable';
export type FinanceStatus = 'pending' | 'reconciled' | 'settled';

export interface FinanceRecord {
  id: string;
  ledgerId: string;
  recordNo: string;
  amount: number;
  type: FinanceType;
  party: string;
  status: FinanceStatus;
  reconciledBy?: string;
  reconciledAt?: string;
  settledAt?: string;
  difference?: number;
  differenceNote?: string;
  remarks: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface OperationLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface CurrentPrice {
  category: Category;
  price: number;
  updatedAt: string;
}

export const categoryLabels: Record<Category, string> = {
  paper: '废纸',
  plastic: '塑料',
  metal: '金属',
  glass: '玻璃',
  electronics: '电子废物',
};

export const exceptionTypeLabels: Record<ExceptionType, string> = {
  environment: '环保问题',
  equipment: '设备故障',
  quality: '质量问题',
  safety: '安全隐患',
};

export const ledgerStatusLabels: Record<LedgerStatus, string> = {
  pending: '待审核',
  verified: '已审核',
  reconciled: '已对账',
  settled: '已结算',
};

export const exceptionStatusLabels: Record<ExceptionStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  rejected: '已驳回',
  closed: '已关闭',
};

export const roleLabels: Record<UserRole, string> = {
  owner: '站点老板',
  weigher: '过磅员',
  accountant: '财务',
};

export const financeTypeLabels: Record<FinanceType, string> = {
  receivable: '应收',
  payable: '应付',
};

export const financeStatusLabels: Record<FinanceStatus, string> = {
  pending: '待对账',
  reconciled: '已对账',
  settled: '已结算',
};
