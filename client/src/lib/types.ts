export type Role = 'manager' | 'editor' | 'service';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface PhotoSlot {
  id: string;
  at: string;
  place: string;
  photographer: string;
}

export interface Selection {
  id: string;
  version: number;
  createdAt: string;
  photos: string[];
  editorId: string;
  editorName: string;
  confirmed: boolean;
  note: string;
}

export interface Payment {
  id: string;
  stage: string;
  amount: number;
  paid: boolean;
  dueAt: string;
  paidAt?: string;
  note: string;
}

export interface ExceptionItem {
  id: string;
  orderId: string;
  kind: string;
  severity: string;
  status: string;
  summary: string;
  detail: string;
  createdAt: string;
  closedAt?: string;
  handledBy?: string;
}

export interface TimelineEvent {
  id: string;
  at: string;
  stage: string;
  actor: string;
  action: string;
  detail: string;
}

export interface Order {
  id: string;
  no: string;
  customerName: string;
  customerPhone: string;
  package: string;
  managerId: string;
  managerName: string;
  editorId: string;
  editorName: string;
  serviceId: string;
  serviceName: string;
  slots: PhotoSlot[];
  selections: Selection[];
  payments: Payment[];
  exceptions: ExceptionItem[];
  timeline: TimelineEvent[];
  status: string;
  createdAt: string;
}

export const API_BASE = 'http://localhost:8787/api';
