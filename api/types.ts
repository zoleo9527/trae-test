export type Role = 'manager' | 'selector' | 'butler';

export interface OrderRow {
  id: string;
  customer_name: string;
  order_no: string;
  shoot_date: string;
  select_date: string | null;
  total_amount: number;
  paid_amount: number;
  status: OrderStatus;
  collection_level: number;
  current_reschedule_id: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'scheduled'
  | 'selected'
  | 'awaiting_payment'
  | 'completed'
  | 'overdue'
  | 'rescheduling'
  | 'cancelled';

export interface TimelineEventRow {
  id: string;
  order_id: string;
  type: 'status' | 'reschedule' | 'collection' | 'note' | 'retouch';
  actor_role: Role;
  actor_name: string;
  at: string;
  payload: string;
}

export interface RescheduleRow {
  id: string;
  order_id: string;
  suggested_from: string;
  suggested_to: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approver_role: Role | null;
  approver_name: string | null;
  approved_at: string | null;
  reject_reason: string | null;
  created_at: string;
}

export interface CollectionRow {
  id: string;
  order_id: string;
  method: 'auto' | 'phone' | 'wechat';
  result: 'pending' | 'contacted' | 'responded' | 'paid' | 'escalated';
  remark: string | null;
  actor_role: Role;
  actor_name: string;
  created_at: string;
}

export interface RetouchRow {
  id: string;
  order_id: string;
  version_no: number;
  remark: string | null;
  created_at: string;
  actor_role: Role;
  actor_name: string;
}

export interface RoleInfo {
  key: Role;
  label: string;
  name: string;
}

export const ROLES: RoleInfo[] = [
  { key: 'manager', label: '门店店长', name: '店长·周嘉诚' },
  { key: 'selector', label: '选片师', name: '选片师·江书言' },
  { key: 'butler', label: '客服管家', name: '管家·谢予安' },
];
