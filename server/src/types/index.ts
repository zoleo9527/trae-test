export type UserRole = 'manager' | 'coach' | 'reception';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
  name: string;
  phone: string;
  created_at: string;
  last_login_at: string | null;
}

export interface Member {
  id: number;
  name: string;
  phone: string;
  member_type: 'normal' | 'silver' | 'gold' | 'diamond';
  birthday: string | null;
  remark: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: number;
  member_id: number;
  principal_balance: number;
  gift_balance: number;
  frozen_balance: number;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'recharge' | 'consume' | 'refund' | 'adjust';
export type ReconciliationStatus = 'pending' | 'matched' | 'mismatched' | 'adjusted';

export interface WalletTransaction {
  id: number;
  wallet_id: number;
  member_id: number;
  type: TransactionType;
  amount: number;
  principal_amount: number;
  gift_amount: number;
  source: string;
  source_id: number | null;
  operator_id: number;
  remark: string | null;
  created_at: string;
  reconciliation_status: ReconciliationStatus;
  reconciliation_id: number | null;
}

export interface Bay {
  id: number;
  name: string;
  bay_number: number;
  status: 'available' | 'maintenance' | 'closed';
  type: 'normal' | 'vip' | 'coach';
  hourly_rate: number;
  created_at: string;
}

export type BookingStatus = 'booked' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';

export interface Booking {
  id: number;
  member_id: number | null;
  bay_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_amount: number;
  status: BookingStatus;
  checkin_operator_id: number | null;
  checkin_at: string | null;
  complete_operator_id: number | null;
  completed_at: string | null;
  created_by: number;
  remark: string | null;
  created_at: string;
}

export interface Equipment {
  id: number;
  name: string;
  category: string;
  brand: string | null;
  specification: string | null;
  total_quantity: number;
  available_quantity: number;
  deposit_amount: number;
  status: 'active' | 'maintenance' | 'retired';
  created_at: string;
}

export type ReturnStatus = 'normal' | 'damaged' | 'lost';

export interface EquipmentRecord {
  id: number;
  equipment_id: number;
  member_id: number;
  booking_id: number | null;
  borrow_operator_id: number;
  borrow_at: string;
  return_operator_id: number | null;
  return_at: string | null;
  return_status: ReturnStatus | null;
  damage_remark: string | null;
  damage_fee: number;
  created_at: string;
}

export interface Reconciliation {
  id: number;
  reconciliation_date: string;
  total_recharge: number;
  total_consume: number;
  total_cash: number;
  difference: number;
  status: 'pending' | 'reviewing' | 'approved' | 'adjusted';
  reviewed_by: number | null;
  reviewed_at: string | null;
  remark: string | null;
  created_at: string;
}

export type ExceptionStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export interface Exception {
  id: number;
  member_id: number | null;
  type: string;
  title: string;
  description: string;
  evidence_screenshot: string | null;
  related_transaction_id: number | null;
  related_booking_id: number | null;
  status: ExceptionStatus;
  created_by: number;
  handled_by: number | null;
  handled_at: string | null;
  handling_result: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  module: string;
  action: string;
  target_type: string;
  target_id: number;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Config {
  id: number;
  key: string;
  value: string;
  description: string | null;
  updated_by: number | null;
  updated_at: string;
}

export interface AuthPayload {
  userId: number;
  username: string;
  role: UserRole;
  name: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TimelineEvent {
  id: number;
  type: 'recharge' | 'consume' | 'booking' | 'equipment' | 'exception';
  title: string;
  description: string;
  amount?: number;
  operator_name: string;
  created_at: string;
  details: any;
}

export interface DashboardOverview {
  today_revenue: number;
  total_wallet_balance: number;
  total_principal_balance: number;
  total_gift_balance: number;
  today_bookings: number;
  bay_utilization: number;
  pending_exceptions: number;
  pending_reconciliation: number;
}

export interface TrendData {
  date: string;
  recharge: number;
  consume: number;
  bookings: number;
}
