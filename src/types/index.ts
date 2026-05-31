export type UserRole = 'manager' | 'chef' | 'customer_service';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export type OrderStatus =
  | 'pending_review'
  | 'reviewed'
  | 'scheduled'
  | 'in_production'
  | 'completed'
  | 'change_requested'
  | 'refund_requested'
  | 'refunded'
  | 'cancelled';

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  specifications: string;
}

export interface OrderHistory {
  id: string;
  orderId: string;
  action: string;
  operator: string;
  operatorRole: UserRole;
  timestamp: string;
  remarks: string;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  deposit: number;
  pickupTime: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignedChef?: string;
  notes: string;
  history: OrderHistory[];
  isUrgent: boolean;
  isOverdue: boolean;
  changeRequest?: ChangeRequest;
  refundRequest?: RefundRequest;
}

export interface ChangeRequest {
  id: string;
  orderId: string;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  refundAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface ProductionSchedule {
  id: string;
  date: string;
  orderId: string;
  chefId: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in_progress' | 'completed';
}

export interface CapacityConfig {
  date: string;
  maxDailyOrders: number;
  chefCapacities: Record<string, number>;
}

export interface Communication {
  id: string;
  orderId: string;
  sender: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
  type: 'internal' | 'customer';
  attachments?: string[];
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  isUrgent?: boolean;
  isOverdue?: boolean;
}

export interface CapacityInfo {
  date: string;
  maxOrders: number;
  currentOrders: number;
  remainingCapacity: number;
  chefLoads: Record<string, { assigned: number; max: number }>;
}
