export type BorrowStatus = 'pending' | 'transferring' | 'installing' | 'completed' | 'exception';
export type TicketStatus = 'pending' | 'verifying' | 'completed' | 'exception';
export type ExceptionStatus = 'pending' | 'processing' | 'resolved' | 'closed';
export type ExceptionType = 'overdue' | 'mismatch' | 'low_checkin' | 'location_mismatch' | 'schedule_conflict';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type UserRole = 'manager' | 'ticket' | 'executor';

export interface ExhibitItem {
  id: string;
  name: string;
  code: string;
  category: string;
  status: 'in_stock' | 'borrowed' | 'installing' | 'returned';
  location: string;
}

export interface ProgressNode {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed';
  operator?: string;
  operateTime?: string;
  remark?: string;
}

export interface ExhibitBorrow {
  id: string;
  orderNo: string;
  exhibitName: string;
  source: string;
  destination: string;
  applicant: string;
  applyTime: string;
  expectCompleteTime: string;
  actualCompleteTime?: string;
  status: BorrowStatus;
  priority: 'high' | 'medium' | 'low';
  items: ExhibitItem[];
  progress: ProgressNode[];
  hasException: boolean;
}

export interface TicketItem {
  id: string;
  ticketNo: string;
  visitorName: string;
  visitorPhone: string;
  status: 'unused' | 'verified' | 'expired' | 'exception';
  verifyTime?: string;
  operator?: string;
}

export interface TicketOrder {
  id: string;
  orderNo: string;
  activityName: string;
  ticketType: string;
  totalCount: number;
  verifiedCount: number;
  exceptionCount: number;
  verifyTime: string;
  operator: string;
  status: TicketStatus;
  items: TicketItem[];
}

export interface HandleRecord {
  id: string;
  operator: string;
  operateTime: string;
  action: string;
  remark: string;
}

export interface ExceptionRecord {
  id: string;
  exceptionNo: string;
  type: ExceptionType;
  title: string;
  description: string;
  relatedOrderId: string;
  relatedOrderType: 'borrow' | 'ticket';
  relatedOrderNo: string;
  status: ExceptionStatus;
  priority: Priority;
  reporter: string;
  reportTime: string;
  handler?: string;
  handleTime?: string;
  resolveTime?: string;
  handleRecords: HandleRecord[];
}

export interface OperationLog {
  id: string;
  operator: string;
  operateTime: string;
  module: string;
  action: string;
  targetId: string;
  targetType: string;
  beforeChange?: string;
  afterChange?: string;
  remark?: string;
}
