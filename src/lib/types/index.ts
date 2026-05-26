export type Role = 'director' | 'dispatcher' | 'operator';

export interface RoleInfo {
  id: Role;
  name: string;
  description: string;
  avatar: string;
  loginId: string;
}

export type FuelType = 'diesel' | 'gasoline' | 'oil';

export type RelayStatus =
  | 'pending_dispatch'
  | 'fuel_approved'
  | 'fuel_issued'
  | 'in_operation'
  | 'awaiting_repair'
  | 'repair_in_progress'
  | 'repair_done'
  | 'subsidy_pending'
  | 'completed'
  | 'exception_late'
  | 'exception_incomplete'
  | 'exception_disconnected';

export type ExceptionType = 'none' | 'late_report' | 'incomplete_subsidy' | 'disconnected' | 'repair_delay';

export interface Plot {
  id: string;
  code: string;
  name: string;
  area: number;
  village: string;
  plannedDate: string;
  actualDate?: string;
  progress: number;
  crop: string;
}

export interface Machine {
  id: string;
  plate: string;
  model: string;
  hours: number;
  status: 'idle' | 'working' | 'repairing';
  operatorId?: string;
}

export interface Operator {
  id: string;
  name: string;
  phone: string;
  license: string;
}

export interface FuelRecord {
  id: string;
  relayId: string;
  type: FuelType;
  amountLiters: number;
  odometerHours: number;
  issuedBy: string;
  issuedAt: string;
  note?: string;
}

export interface RepairRecord {
  id: string;
  relayId: string;
  category: string;
  description: string;
  parts: string[];
  cost: number;
  reportedBy: string;
  reportedAt: string;
  repairedBy?: string;
  repairedAt?: string;
  followUpNeeded: boolean;
  status: 'pending' | 'in_progress' | 'done' | 'follow_up';
}

export interface SubsidyRecord {
  id: string;
  relayId: string;
  materials: string[];
  collected: boolean;
  note?: string;
  collectedAt?: string;
}

export interface RelayItem {
  id: string;
  plotId: string;
  machineId: string;
  operatorId: string;
  taskType: string;
  status: RelayStatus;
  exceptionType: ExceptionType;
  exceptionDesc?: string;
  fuelApproved?: FuelRecord;
  fuelIssued?: FuelRecord;
  repair?: RepairRecord;
  subsidy?: SubsidyRecord;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  at: string;
  role: Role;
  action: string;
  note?: string;
}

export interface FilterState {
  roleView: Role;
  status: RelayStatus | 'all';
  exceptionType: ExceptionType | 'all';
  operatorId: string | 'all';
  machineId: string | 'all';
  keyword: string;
  dateFrom?: string;
  dateTo?: string;
}
