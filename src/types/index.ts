export type UserRole = 'director' | 'dispatcher' | 'operator';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
}

export type MachineType = 'tractor' | 'combine' | 'sprayer' | 'transplanter';

export interface Operator {
  id: string;
  name: string;
  phone: string;
  machineType: MachineType;
  machineNo: string;
  status: 'idle' | 'working' | 'maintenance';
  location: string;
}

export interface Plot {
  id: string;
  name: string;
  area: number; // mu
  crop: string;
  location: string;
  distance: number; // km
}

export type TaskStatus =
  | 'pending'     // 待派单
  | 'assigned'    // 已派单待确认
  | 'confirmed'   // 机手已确认
  | 'in_progress' // 作业中
  | 'completed'   // 已完成
  | 'incident';   // 异常

export interface TimelineEntry {
  at: string;
  actor: string;
  action: string;
  note?: string;
}

export interface Task {
  id: string;
  plotId: string;
  crop: string;
  area: number;
  machineType: MachineType;
  expectedAt: string;       // ISO datetime
  durationHours: number;
  operatorId?: string;
  status: TaskStatus;
  notes?: string;
  timeline: TimelineEntry[];
}

export type IncidentType = 'progress' | 'subsidy' | 'repair' | 'followup';
export type IncidentSeverity = 'low' | 'medium' | 'high';

export interface Incident {
  id: string;
  taskId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  reporterId: string;
  handlerId?: string;
  reportedAt: string;
  resolvedAt?: string;
  resolved: boolean;
  timeline: TimelineEntry[];
  attachments?: string[];
}
