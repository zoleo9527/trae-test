export type UserRole = 'manager' | 'consultant' | 'technician';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export type WorkOrderStatus = 
  | 'pending_review'
  | 'quoting'
  | 'pending_approval'
  | 'rejected'
  | 'pending_confirm'
  | 'customer_rejected'
  | 'repairing'
  | 'completed'
  | 'picked_up';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface CustomerReceipt {
  id: string;
  workOrderId: string;
  confirmed: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  feedback?: string;
  satisfaction?: number;
  satisfactionComment?: string;
  satisfactionAt?: string;
  pickedUp: boolean;
  pickedUpAt?: string;
  pickedUpBy?: string;
  pickupNote?: string;
}

export interface RepairProgress {
  id: string;
  workOrderId: string;
  status: 'inspecting' | 'parts_preparing' | 'repairing' | 'testing' | 'completed';
  description: string;
  operator: string;
  operatorRole: UserRole;
  createdAt: string;
}

export interface PartInventory {
  id: string;
  partCode: string;
  partName: string;
  stock: number;
  locked: number;
  unit: string;
  price: number;
}

export type ActionType =
  | 'register'
  | 'start_inspect'
  | 'lock_parts'
  | 'release_parts'
  | 'submit_quote'
  | 'approve_quote'
  | 'reject_quote'
  | 'send_confirmation'
  | 'customer_confirm'
  | 'customer_reject'
  | 'start_repair'
  | 'update_progress'
  | 'complete_repair'
  | 'notify_pickup'
  | 'confirm_pickup'
  | 'satisfaction_survey'
  | 'reopen'
  | 'close';

export interface Quote {
  id: string;
  workOrderId: string;
  amount: number;
  partsCost: number;
  laborCost: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  remark?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface PartLock {
  id: string;
  partName: string;
  partCode: string;
  quantity: number;
  status: 'locked' | 'released' | 'used';
  lockedBy: string;
  lockedAt: string;
}

export interface TimelineEntry {
  id: string;
  action: string;
  operator: string;
  operatorRole: UserRole;
  remark?: string;
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  orderNo: string;
  customer: Customer;
  watchBrand: string;
  watchModel: string;
  watchSerial?: string;
  problemDesc: string;
  inspectionResult?: string;
  status: WorkOrderStatus;
  priority: Priority;
  receivedAt: string;
  expectedDate?: string;
  quote?: Quote;
  parts: PartLock[];
  timeline: TimelineEntry[];
  progress: RepairProgress[];
  receipt?: CustomerReceipt;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  rejectReason?: string;
  customerRejectReason?: string;
}

export interface DashboardStats {
  pending: number;
  rejected: number;
  needReview: number;
  todayNew: number;
  completedThisWeek: number;
  avgProcessTime: number;
  needFollowUp: number;
}

export interface WorkOrderAction {
  actionType: ActionType;
  remark?: string;
  amount?: number;
  partsCost?: number;
  laborCost?: number;
  rejectReason?: string;
  satisfaction?: number;
  satisfactionComment?: string;
  pickupNote?: string;
  parts?: Array<{
    partName: string;
    partCode: string;
    quantity: number;
  }>;
  inspectionResult?: string;
}

export interface FilterOptions {
  status?: WorkOrderStatus[];
  priority?: Priority[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
