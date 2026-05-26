export type UserRole = 'manager' | 'picker' | 'accountant';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export type ComplaintStatus = 'pending' | 'rechecking' | 'compensating' | 'payment_pending' | 'completed' | 'rejected';

export interface Complaint {
  id: string;
  customerName: string;
  customerPhone?: string;
  complaintType: string;
  description?: string;
  weightNoteNo?: string;
  coldStorageNo?: string;
  status: ComplaintStatus;
  createdBy?: string;
  creator?: User;
  rechecks?: Recheck[];
  compensations?: Compensation[];
  statusLogs?: StatusLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Recheck {
  id: string;
  complaintId: string;
  recheckPerson?: string;
  coldStorageLocation?: string;
  recheckTime?: Date;
  gradeResult?: string;
  lossRatio?: number;
  lossAmount?: number;
  remark?: string;
  operatorId?: string;
  operator?: User;
  createdAt: Date;
}

export type CompensationStatus = 'pending' | 'approved' | 'rejected';

export interface Compensation {
  id: string;
  complaintId: string;
  amount: number;
  compensationMethod?: string;
  status: CompensationStatus;
  approvedBy?: string;
  approver?: User;
  remark?: string;
  approvedAt?: Date;
  payments?: Payment[];
  createdAt: Date;
}

export interface Payment {
  id: string;
  compensationId: string;
  amount: number;
  paymentDate?: Date;
  paymentMethod?: string;
  recordedBy?: string;
  recorder?: User;
  remark?: string;
  createdAt: Date;
}

export interface StatusLog {
  id: string;
  complaintId: string;
  fromStatus?: string;
  toStatus?: string;
  remark?: string;
  operatorId?: string;
  operator?: User;
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Statistics {
  total: number;
  byStatus: Record<string, number>;
}

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: '待处理',
  rechecking: '复检中',
  compensating: '赔付审批中',
  payment_pending: '待回款',
  completed: '已完成',
  rejected: '已驳回',
};

export const STATUS_COLORS: Record<ComplaintStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  rechecking: 'bg-blue-100 text-blue-700',
  compensating: 'bg-purple-100 text-purple-700',
  payment_pending: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-100 text-gray-700',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  manager: '档口负责人',
  picker: '配货员',
  accountant: '财务记账',
};

export const COMPLAINT_TYPES = [
  '质量问题',
  '重量不足',
  '配送错误',
  '包装损坏',
  '延迟送达',
  '规格不符',
  '数量短缺',
  '其他',
];
