export enum WorkOrderStatus {
  ABNORMAL_REPORTED = 'abnormal_reported',
  DOWNTIME_CONFIRMED = 'downtime_confirmed',
  PART_REQUESTED = 'part_requested',
  PART_APPROVED = 'part_approved',
  PART_RECEIVED = 'part_received',
  REPAIR_COMPLETED = 'repair_completed',
  REVIEW_SUBMITTED = 'review_submitted',
  CLOSED = 'closed',
}

export const WorkOrderStatusLabels: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.ABNORMAL_REPORTED]: '异常上报',
  [WorkOrderStatus.DOWNTIME_CONFIRMED]: '停机确认',
  [WorkOrderStatus.PART_REQUESTED]: '备件申请',
  [WorkOrderStatus.PART_APPROVED]: '备件审批通过',
  [WorkOrderStatus.PART_RECEIVED]: '备件已领取',
  [WorkOrderStatus.REPAIR_COMPLETED]: '维修完成',
  [WorkOrderStatus.REVIEW_SUBMITTED]: '复盘已提交',
  [WorkOrderStatus.CLOSED]: '已关闭',
};

export enum AbnormalType {
  INVERTER_FAULT = 'inverter_fault',
  STRING_ABNORMAL = 'string_abnormal',
  COMMUNICATION_FAILURE = 'communication_failure',
  GRID_ABNORMAL = 'grid_abnormal',
  WEATHER_ISSUE = 'weather_issue',
  OTHER = 'other',
}

export const AbnormalTypeLabels: Record<AbnormalType, string> = {
  [AbnormalType.INVERTER_FAULT]: '逆变器故障',
  [AbnormalType.STRING_ABNORMAL]: '组串异常',
  [AbnormalType.COMMUNICATION_FAILURE]: '通信故障',
  [AbnormalType.GRID_ABNORMAL]: '电网异常',
  [AbnormalType.WEATHER_ISSUE]: '天气问题',
  [AbnormalType.OTHER]: '其他',
};

export enum UserRole {
  STATION_MASTER = 'station_master',
  INSPECTION_ENGINEER = 'inspection_engineer',
  OPERATION_STAFF = 'operation_staff',
  ADMIN = 'admin',
}

export const RoleLabels: Record<UserRole, string> = {
  [UserRole.STATION_MASTER]: '站长',
  [UserRole.INSPECTION_ENGINEER]: '巡检工程师',
  [UserRole.OPERATION_STAFF]: '运维内勤',
  [UserRole.ADMIN]: '管理员',
};

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  station?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  orderNo: string;
  title: string;
  status: WorkOrderStatus;
  abnormalType: AbnormalType;
  description?: string;
  equipmentNo?: string;
  station: string;
  powerLoss?: number;
  totalDowntimeMinutes?: number;
  reporterId?: string;
  reporter?: User;
  handlerId?: string;
  handler?: User;
  remark?: string;
  downtimeRecords?: DowntimeRecord[];
  partUsages?: PartUsage[];
  reviewRecords?: ReviewRecord[];
  statusHistories?: StatusHistory[];
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DowntimeRecord {
  id: string;
  workOrderId: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  reason?: string;
  isConfirmed: boolean;
  confirmedById?: string;
  confirmedBy?: User;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum PartRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RECEIVED = 'received',
}

export const PartRequestStatusLabels: Record<PartRequestStatus, string> = {
  [PartRequestStatus.PENDING]: '待审批',
  [PartRequestStatus.APPROVED]: '已批准',
  [PartRequestStatus.REJECTED]: '已拒绝',
  [PartRequestStatus.RECEIVED]: '已签收',
};

export interface SparePart {
  id: string;
  partCode: string;
  name: string;
  specification?: string;
  manufacturer?: string;
  unitPrice: number;
  stockQuantity: number;
  unit?: string;
  location?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartUsage {
  id: string;
  workOrderId: string;
  sparePartId: string;
  sparePart: SparePart;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  status: PartRequestStatus;
  requestReason?: string;
  requestedById?: string;
  requestedBy?: User;
  approvedById?: string;
  approvedBy?: User;
  approvedAt?: string;
  approvalRemark?: string;
  receivedById?: string;
  receivedBy?: User;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ReviewLevel {
  MINOR = 'minor',
  MAJOR = 'major',
  CRITICAL = 'critical',
}

export const ReviewLevelLabels: Record<ReviewLevel, string> = {
  [ReviewLevel.MINOR]: '一般',
  [ReviewLevel.MAJOR]: '重要',
  [ReviewLevel.CRITICAL]: '严重',
};

export interface ReviewRecord {
  id: string;
  workOrderId: string;
  level: ReviewLevel;
  rootCause?: string;
  repairProcess?: string;
  improvementMeasures?: string;
  lessonsLearned?: string;
  actualDowntimeMinutes: number;
  actualPowerLoss?: number;
  actualPartCost?: number;
  actualLaborCost?: number;
  totalCost?: number;
  submittedById?: string;
  submittedBy?: User;
  submittedAt?: string;
  isVerified: boolean;
  verifiedById?: string;
  verifiedBy?: User;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistory {
  id: string;
  workOrderId: string;
  fromStatus?: WorkOrderStatus;
  toStatus: WorkOrderStatus;
  remark?: string;
  operatedById?: string;
  operatedBy?: User;
  operatedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
