import type { RelayStatus, Role } from '../types';

export const ROLE_ALLOWED_ACTIONS: Record<Role, string[]> = {
  director: ['view_all', 'view_stats', 'export'],
  dispatcher: ['create_task', 'approve_fuel', 'register_repair', 'mark_repair_done', 'collect_subsidy', 'follow_up'],
  operator: ['confirm_task', 'report_progress', 'report_late', 'claim_fuel', 'submit_repair']
};

export const STATUS_FLOW: Record<RelayStatus, RelayStatus[]> = {
  pending_dispatch: ['fuel_approved'],
  fuel_approved: ['fuel_issued', 'awaiting_repair'],
  fuel_issued: ['in_operation'],
  in_operation: ['awaiting_repair', 'subsidy_pending', 'exception_late', 'completed'],
  awaiting_repair: ['repair_in_progress'],
  repair_in_progress: ['repair_done'],
  repair_done: ['in_operation', 'subsidy_pending', 'exception_disconnected'],
  subsidy_pending: ['completed'],
  completed: [],
  exception_late: ['in_operation', 'awaiting_repair'],
  exception_incomplete: ['subsidy_pending', 'completed'],
  exception_disconnected: ['repair_in_progress', 'subsidy_pending']
};

export function canTransition(from: RelayStatus, to: RelayStatus): boolean {
  return STATUS_FLOW[from]?.includes(to) ?? false;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
