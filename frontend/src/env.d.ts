/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'owner' | 'printer' | 'customer_service';
  avatar: string;
}

export interface FilmRoll {
  id: string;
  rollNumber: string;
  customerName: string;
  customerPhone: string;
  filmType: 'color' | 'bw' | 'slide';
  filmBrand: string;
  iso: number;
  exposures: number;
  status: string;
  scanResolution?: string;
  deliveryVersion?: string;
  isMixed: boolean;
  mixedNote?: string;
  mixedWithRollNumber?: string;
  internalNotes?: string;
  registeredAt: string;
  completedAt?: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  category: string;
  problemType?: string;
  title: string;
  description?: string;
  status: string;
  filmRoll?: FilmRoll;
  assignee?: User;
  requestedAmount?: number;
  originalPrice?: number;
  hasEvidence?: boolean;
  negotiationSummary?: string;
  reviewConclusion?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  statusLogs?: StatusLog[];
  notes?: Note[];
  compensation?: Compensation;
}

export interface StatusLog {
  id: string;
  workOrderId: string;
  fromStatus: string;
  toStatus: string;
  remark?: string;
  operatorName?: string;
  operatorRole?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  workOrderId: string;
  content: string;
  type: 'internal' | 'customer' | 'negotiation' | 'review';
  isPrivate: boolean;
  creatorName?: string;
  creatorRole?: string;
  createdAt: string;
}

export interface Compensation {
  id: string;
  workOrderId: string;
  type: string;
  amount: number;
  customerCost: number;
  labCost: number;
  reason?: string;
  status: string;
  ownerReview?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
}
