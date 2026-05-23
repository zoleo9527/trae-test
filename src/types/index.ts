export type UserRole = 'admin' | 'engineer' | 'staff';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  avatar: string;
  station: string;
}

export type WorkOrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'waiting_spare' 
  | 'reviewing' 
  | 'returned' 
  | 'closed';

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  station: string;
  assigneeId: string;
  alarmId?: string;
  createdAt: string;
  updatedAt: string;
  deadline: string;
  downtimeHours: number;
  photos: string[];
}

export interface WorkOrderLog {
  id: string;
  workorderId: string;
  action: string;
  operatorId: string;
  remark: string;
  createdAt: string;
}

export type AlarmLevel = 'critical' | 'warning' | 'info';
export type AlarmStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alarm {
  id: string;
  type: string;
  description: string;
  level: AlarmLevel;
  currentValue: number;
  thresholdValue: number;
  station: string;
  inverterId: string;
  createdAt: string;
  status: AlarmStatus;
  workorderId?: string;
}

export type SparePartStatus = 'pending' | 'approved' | 'issued' | 'returned' | 'rejected';

export interface SparePartRequest {
  id: string;
  workorderId: string;
  requesterId: string;
  partName: string;
  partCode: string;
  quantity: number;
  unit: string;
  status: SparePartStatus;
  createdAt: string;
  approvedAt?: string;
  approverId?: string;
}

export interface DashboardStats {
  totalWorkOrders: number;
  pendingWorkOrders: number;
  activeAlarms: number;
  criticalAlarms: number;
  totalDowntime: number;
  completionRate: number;
  todayNewWorkOrders: number;
  overdueWorkOrders: number;
}
