export type Role = "supervisor" | "inspector" | "customer_service";

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
}

export type StationStatus = "normal" | "warning" | "fault" | "maintenance";

export interface Station {
  id: string;
  name: string;
  address: string;
  status: StationStatus;
  deviceCount: number;
  lastInspection: string;
  managerId: string;
}

export type DeviceStatus = "online" | "offline" | "fault" | "maintenance";

export interface Device {
  id: string;
  stationId: string;
  name: string;
  model: string;
  status: DeviceStatus;
  lastMaintenance: string;
  faultCount: number;
}

export type MaterialStatus = "normal" | "low" | "out_of_stock";

export interface Material {
  id: string;
  name: string;
  sku: string;
  category: "soap" | "wax" | "towel" | "brush" | "other";
  currentStock: number;
  minStock: number;
  unit: string;
  status: MaterialStatus;
}

export interface StationMaterial {
  stationId: string;
  materialId: string;
  currentStock: number;
  lastRestock: string;
}

export type WorkOrderType = "repair" | "restock" | "inspection" | "complaint";

export type WorkOrderPriority = "low" | "medium" | "high" | "urgent";

export type WorkOrderStatus =
  | "pending"
  | "assigned"
  | "processing"
  | "reviewing"
  | "completed"
  | "rejected"
  | "escalated";

export interface WorkOrderHistoryItem {
  status: WorkOrderStatus;
  operatorId: string;
  timestamp: string;
  remark: string;
}

export interface EvidenceAttachment {
  id: string;
  type: "image" | "video" | "audio" | "text";
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  description: string;
}

export interface RejectInfo {
  reason: string;
  operatorId: string;
  timestamp: string;
  supplement: string;
}

export interface WorkOrder {
  id: string;
  type: WorkOrderType;
  title: string;
  description: string;
  stationId: string;
  deviceId?: string;
  materialId?: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  creatorId: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  history: WorkOrderHistoryItem[];
  attachments: EvidenceAttachment[];
  rejectInfo?: RejectInfo;
  supplement?: string;
  refundAmount?: number;
  relatedOrderId?: string;
}

export type RefundStatus = "pending" | "reviewing" | "approved" | "rejected" | "transferred";

export interface RefundRequest {
  id: string;
  workOrderId: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  reason: string;
  evidence: string;
  status: RefundStatus;
  createdBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  transferedAt?: string;
}

export interface ScheduleItem {
  id: string;
  inspectorId: string;
  stationId: string;
  date: string;
  timeSlot: string;
  tasks: string[];
  status: "pending" | "in_progress" | "completed" | "skipped";
  workOrderIds: string[];
}

export interface HistoryRemark {
  id: string;
  workOrderId: string;
  content: string;
  authorId: string;
  createdAt: string;
  type: "system" | "manual";
}
