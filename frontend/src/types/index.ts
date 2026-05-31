export type Role = 'project_manager' | 'quality_engineer' | 'team_leader';

export const RoleLabels: Record<Role, string> = {
  project_manager: '项目负责人',
  quality_engineer: '质检工程师',
  team_leader: '班组长',
};

export type ShippingStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'shipped' 
  | 'received' 
  | 'completed' 
  | 'rejected';

export const ShippingStatusLabels: Record<ShippingStatus, string> = {
  draft: '草稿',
  pending_approval: '待审核',
  approved: '已批准',
  shipped: '已发货',
  received: '已签收',
  completed: '已完成',
  rejected: '已驳回',
};

export type ReceiptStatus = 
  | 'pending' 
  | 'signed' 
  | 'has_difference' 
  | 'verified' 
  | 'disputed';

export const ReceiptStatusLabels: Record<ReceiptStatus, string> = {
  pending: '待签收',
  signed: '已签收',
  has_difference: '有差异',
  verified: '已核验',
  disputed: '有争议',
};

export type ReworkStatus = 
  | 'created' 
  | 'in_progress' 
  | 'submitted' 
  | 'passed' 
  | 'failed' 
  | 'closed';

export const ReworkStatusLabels: Record<ReworkStatus, string> = {
  created: '已创建',
  in_progress: '整改中',
  submitted: '待复查',
  passed: '已通过',
  failed: '未通过',
  closed: '已闭环',
};

export type DisputeStatus = 
  | 'pending' 
  | 'negotiating' 
  | 'ruled' 
  | 'resolved' 
  | 'appealed';

export const DisputeStatusLabels: Record<DisputeStatus, string> = {
  pending: '待处理',
  negotiating: '协商中',
  ruled: '已裁定',
  resolved: '已解决',
  appealed: '已申诉',
};

export type Responsibility = 
  | 'logistics' 
  | 'warehouse' 
  | 'construction_team' 
  | 'supplier' 
  | 'other';

export const ResponsibilityLabels: Record<Responsibility, string> = {
  logistics: '物流方',
  warehouse: '发货方',
  construction_team: '施工班组',
  supplier: '供应商',
  other: '其他',
};

export type AlertPriority = 'high' | 'medium' | 'low';

export const AlertPriorityLabels: Record<AlertPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export type AlertType = 
  | 'material_difference' 
  | 'rework_overdue' 
  | 'settlement_risk' 
  | 'shipping_delay' 
  | 'receipt_delay';

export const AlertTypeLabels: Record<AlertType, string> = {
  material_difference: '材料差异',
  rework_overdue: '返工超期',
  settlement_risk: '结算风险',
  shipping_delay: '发货延迟',
  receipt_delay: '回单延迟',
};

export type DifferenceType = 'quantity' | 'quality' | 'spec' | 'damage' | 'other';

export const DifferenceTypeLabels: Record<DifferenceType, string> = {
  quantity: '数量差异',
  quality: '质量问题',
  spec: '规格不符',
  damage: '运输损坏',
  other: '其他',
};

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  phone?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'paused' | 'completed';
  progress: number;
  startDate: string;
  endDate: string;
  contractAmount: number;
  location: string;
  managerId: string;
}

export interface MaterialItem {
  id: string;
  shippingId: string;
  name: string;
  spec: string;
  quantity: number;
  receivedQuantity?: number;
  unit: string;
  unitPrice: number;
  remark?: string;
}

export interface ShippingOrder {
  id: string;
  projectId: string;
  code: string;
  status: ShippingStatus;
  title: string;
  materialItems: MaterialItem[];
  totalAmount: number;
  createdAt: string;
  createdBy: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  shippedAt?: string;
  shipper?: string;
  carrier?: string;
  trackingNo?: string;
  estimatedArrival?: string;
  rejectReason?: string;
  remark?: string;
}

export interface DifferenceRecord {
  id: string;
  receiptId: string;
  type: DifferenceType;
  materialId?: string;
  materialName?: string;
  description: string;
  quantity?: number;
  amount: number;
  responsibility: Responsibility;
  evidenceUrls?: string[];
  reportedBy: string;
  reportedAt: string;
  resolved?: boolean;
  resolvedAt?: string;
  resolution?: string;
}

export interface Receipt {
  id: string;
  shippingId: string;
  projectId: string;
  status: ReceiptStatus;
  signedAt?: string;
  signedBy?: string;
  signedLocation?: string;
  differences: DifferenceRecord[];
  verifiedAt?: string;
  verifiedBy?: string;
  remark?: string;
}

export interface ReworkStep {
  id: string;
  reworkId: string;
  action: string;
  operator: string;
  operatorName: string;
  timestamp: string;
  remark?: string;
  evidenceUrls?: string[];
}

export interface ReworkOrder {
  id: string;
  projectId: string;
  code: string;
  status: ReworkStatus;
  title: string;
  reason: string;
  reasonCategory: string;
  location: string;
  responsibleParty: Responsibility;
  assignee?: string;
  deadline?: string;
  createdAt: string;
  createdBy: string;
  steps: ReworkStep[];
  estimatedCost?: number;
  actualCost?: number;
  remark?: string;
}

export interface SettlementDispute {
  id: string;
  projectId: string;
  code: string;
  status: DisputeStatus;
  title: string;
  type: 'material' | 'labor' | 'rework' | 'other';
  amount: number;
  applicant: string;
  respondent: string;
  description: string;
  createdAt: string;
  ruling?: string;
  ruledBy?: string;
  ruledAt?: string;
  negotiationRecords?: Array<{
    id: string;
    content: string;
    author: string;
    timestamp: string;
  }>;
  resolution?: string;
  resolvedAt?: string;
  sourceReceiptId?: string;
  sourceDifferenceId?: string;
  sourceShippingId?: string;
  sourceReworkId?: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  description: string;
  projectId?: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  read: boolean;
  handled: boolean;
  handledAt?: string;
}

export interface ActionLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  targetType: string;
  targetId: string;
  targetName?: string;
  timestamp: string;
  ip?: string;
  detail?: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  pendingApprovals: number;
  pendingReceipts: number;
  pendingReworks: number;
  openAlerts: number;
  totalShippedAmount: number;
  disputedAmount: number;
  monthlyShippingTrend: Array<{
    month: string;
    amount: number;
  }>;
  materialUsage: Array<{
    name: string;
    value: number;
  }>;
  reworkReasons: Array<{
    name: string;
    count: number;
  }>;
}
