export enum UserRole {
  OPERATION_MANAGER = 'OPERATION_MANAGER',
  INSPECTOR = 'INSPECTOR',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
}

export enum RefundStatus {
  SUBMITTED = 'SUBMITTED',
  CS_REVIEWING = 'CS_REVIEWING',
  INSPECTION_REQUIRED = 'INSPECTION_REQUIRED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export enum TaskStatus {
  UNASSIGNED = 'UNASSIGNED',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ESCALATED = 'ESCALATED',
}

export enum TaskType {
  VERIFICATION_DISPUTE = 'VERIFICATION_DISPUTE',
  REFUND_REVIEW = 'REFUND_REVIEW',
  STATION_INSPECTION = 'STATION_INSPECTION',
  SUPPLY_REPLENISHMENT = 'SUPPLY_REPLENISHMENT',
}

export enum StationStatus {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  ABNORMAL = 'ABNORMAL',
  MAINTENANCE = 'MAINTENANCE',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  status: StationStatus;
  warningLevel: number;
  lowSupplies?: SupplyRecord[];
}

export interface SupplyRecord {
  id: string;
  supplyType: string;
  currentQty: number;
  warningQty: number;
}

export interface CustomerPackage {
  id: string;
  customerName: string;
  customerPhone: string;
  packageType: string;
  totalCount: number;
  usedCount: number;
  price: number;
}

export interface RefundRequest {
  id: string;
  packageId: string;
  package: CustomerPackage;
  verificationId?: string;
  verification?: VerificationRecord;
  status: RefundStatus;
  customerReason: string;
  refundCount: number;
  submitTime: string;
  csReviewer?: User;
  csOpinion?: string;
  inspector?: User;
  inspectionResult?: string;
  finalDecision?: string;
  finalReviewer?: User;
}

export interface VerificationRecord {
  id: string;
  stationId: string;
  station: Station;
  verifyTime: string;
  photoUrl?: string;
}

export interface RefundFlowLog {
  id: string;
  fromStatus: RefundStatus;
  toStatus: RefundStatus;
  operatorName: string;
  operatorRole: UserRole;
  remark?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  type: TaskType;
  stationId: string;
  station: Station;
  relatedId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee?: User;
  priority: number;
  escalated: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalStations: number;
  abnormalStations: number;
  activePackages: number;
  pendingRefunds: number;
  openTasks: number;
}

export interface BatchReviewItem {
  refundId: string;
  action: 'APPROVE' | 'REJECT' | 'NEED_INSPECTION';
  remark?: string;
}
