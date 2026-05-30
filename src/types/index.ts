export type OrderStatus =
  | 'collected'
  | 'sorting'
  | 'washing'
  | 'inspecting'
  | 'handover'
  | 'verifying'
  | 'completed'
  | 'rejected'
  | 'rewashing'
  | 'damage_claim';

export type Role = 'factory_manager' | 'inspector' | 'store_handler';

export type RejectSource = 'store_receipt' | 'damage_claim' | 'quality_inspect';

export interface Order {
  id: string;
  orderNo: string;
  storeName: string;
  customerName: string;
  garmentType: string;
  garmentDesc: string;
  status: OrderStatus;
  assignedTo: Role;
  batchId: string | null;
  createdAt: string;
  updatedAt: string;
  deadlineAt: string;
  isOverdue: boolean;
  isUrgent: boolean;
  rejectSource?: RejectSource;
}

export interface Batch {
  id: string;
  batchNo: string;
  washType: string;
  washStartTime: string;
  washEndTime: string | null;
  status: 'pending' | 'washing' | 'completed';
  orderIds: string[];
}

export interface DamageRecord {
  id: string;
  orderId: string;
  position: string;
  description: string;
  imageUrl: string;
  recordedAt: string;
  recordedBy: string;
}

export interface RewashRecord {
  id: string;
  orderId: string;
  reason: string;
  description: string;
  createdAt: string;
  rewashCompletedAt: string | null;
  status: 'pending' | 'rewashing' | 'completed';
}

export interface Receipt {
  id: string;
  orderId: string;
  isVerified: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
  isRejected: boolean;
  rejectReason: string | null;
}

export interface ActivityLog {
  id: string;
  orderId: string;
  action: string;
  operator: string;
  role: Role;
  timestamp: string;
  detail: string;
}

export interface ProcessingContext {
  orderId: string | null;
  isOpen: boolean;
  mode: 'inspect' | 'damage' | 'rewash' | 'handover' | 'verify' | 'sort' | 'rejected_review' | 'rejected_damage_review' | 'rejected_store_resubmit' | null;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  collected: '已收衣',
  sorting: '分拣中',
  washing: '洗涤中',
  inspecting: '质检中',
  handover: '待交接',
  verifying: '核验中',
  completed: '已完成',
  rejected: '已退回',
  rewashing: '返洗中',
  damage_claim: '污损赔付',
};

export const REJECT_SOURCE_LABELS: Record<RejectSource, string> = {
  store_receipt: '门店回单退回',
  damage_claim: '污损赔付退回',
  quality_inspect: '质检问题退回',
};

export const ROLE_LABELS: Record<Role, string> = {
  factory_manager: '厂长',
  inspector: '质检员',
  store_handler: '门店交接',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  collected: 'bg-slate-400',
  sorting: 'bg-amber-400',
  washing: 'bg-blue-400',
  inspecting: 'bg-purple-400',
  handover: 'bg-cyan-400',
  verifying: 'bg-teal-400',
  completed: 'bg-emerald-400',
  rejected: 'bg-red-400',
  rewashing: 'bg-orange-400',
  damage_claim: 'bg-rose-400',
};

export const STATUS_BORDER_COLORS: Record<OrderStatus, string> = {
  collected: 'border-l-slate-400',
  sorting: 'border-l-amber-400',
  washing: 'border-l-blue-400',
  inspecting: 'border-l-purple-400',
  handover: 'border-l-cyan-400',
  verifying: 'border-l-teal-400',
  completed: 'border-l-emerald-400',
  rejected: 'border-l-red-400',
  rewashing: 'border-l-orange-400',
  damage_claim: 'border-l-rose-400',
};

export const GARMENT_TYPES = ['西装', '衬衫', '羽绒服', '大衣', '裙子', '裤子', '床品', '窗帘'];
export const DAMAGE_POSITIONS = ['领口', '袖口', '前襟', '后背', '下摆', '口袋', '拉链', '纽扣', '整体泛黄', '其他'];
export const WASH_TYPES = ['干洗', '水洗', '手洗', '烘干', '特殊处理'];
export const REWASH_REASONS = ['污渍未清', '漂白过度', '缩水变形', '色泽不均', '异味残留', '其他'];
export const STORE_NAMES = ['国贸旗舰店', '朝阳门店', '望京店', '三里屯店', '中关村店', '西单店'];
