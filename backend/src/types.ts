export type UserRole = 'THEATER_MANAGER' | 'TICKET_SUPERVISOR' | 'BACKEND_COORDINATOR';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export type ShowStatus = 'DRAFT' | 'CONFIRMED' | 'MODIFIED' | 'CANCELLED';
export type ShowType = 'DRAMA' | 'OPERA' | 'CONCERT' | 'DANCE' | 'CHILDREN';

export interface Show {
  id: string;
  name: string;
  type: ShowType;
  startTime: string;
  endTime: string;
  venue: string;
  totalSeats: number;
  status: ShowStatus;
  rehearsalSchedule?: RehearsalSlot[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  changeLog: ShowChangeLog[];
}

export interface RehearsalSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'WALKTHROUGH' | 'TECH' | 'DRESS' | 'FULL';
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface ShowChangeLog {
  id: string;
  changedBy: string;
  changedAt: string;
  field: string;
  oldValue: string;
  newValue: string;
  reason?: string;
}

export type GroupOrderStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'MODIFIED' | 'CANCELLED' | 'COMPLETED';

export interface GroupOrder {
  id: string;
  orderNo: string;
  showId: string;
  organization: string;
  contactName: string;
  contactPhone: string;
  ticketCount: number;
  unitPrice: number;
  totalAmount: number;
  status: GroupOrderStatus;
  specialRequirements?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
  version: number;
  changeLog: OrderChangeLog[];
  settlement?: Settlement;
}

export interface OrderChangeLog {
  id: string;
  changedBy: string;
  changedAt: string;
  action: string;
  description: string;
}

export type RefundRequestStatus = 'PENDING' | 'APPROVED_TICKET' | 'APPROVED_MANAGER' | 'REJECTED' | 'COMPLETED';
export type RefundType = 'FULL' | 'PARTIAL' | 'DATE_CHANGE';

export interface RefundRequest {
  id: string;
  requestNo: string;
  orderId: string;
  showId: string;
  type: RefundType;
  reason: string;
  originalTicketCount: number;
  refundTicketCount: number;
  refundAmount: number;
  newShowId?: string;
  status: RefundRequestStatus;
  applicantName: string;
  applicantPhone: string;
  createdAt: string;
  ticketApprovedBy?: string;
  ticketApprovedAt?: string;
  ticketApprovalNote?: string;
  managerApprovedBy?: string;
  managerApprovedAt?: string;
  managerApprovalNote?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  completedAt?: string;
}

export interface Settlement {
  id: string;
  orderId: string;
  totalAmount: number;
  paidAmount: number;
  refundAmount: number;
  netAmount: number;
  status: 'UNPAID' | 'PARTIAL' | 'SETTLED';
  paymentRecords: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  recordedBy: string;
  remark?: string;
}

export interface OperationLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  ip?: string;
  createdAt: string;
}
