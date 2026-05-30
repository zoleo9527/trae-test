export type UserRole = 'factory_manager' | 'quality_inspector' | 'store_manager';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'sorted' 
  | 'washing' 
  | 'quality_check' 
  | 'rewash' 
  | 'ready' 
  | 'delivered' 
  | 'complaint' 
  | 'completed';

export type ClothingType = 'shirt' | 'pants' | 'coat' | 'dress' | 'suit' | 'others';
export type WashType = 'dry' | 'water' | 'hand';

export interface ClothingItem {
  id: string;
  orderId: string;
  name: string;
  type: ClothingType;
  washType: WashType;
  price: number;
  brand?: string;
  color?: string;
  defects?: string[];
  defectPhotos?: string[];
  status: OrderStatus;
  batchId?: string;
  rewashCount: number;
  remark?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  storeId: string;
  storeName: string;
  customerName: string;
  customerPhone?: string;
  items: ClothingItem[];
  totalAmount: number;
  receivedAt: string;
  expectedDeliveryAt: string;
  actualDeliveryAt?: string;
  status: OrderStatus;
  currentBatchId?: string;
  remark?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Batch {
  id: string;
  batchNo: string;
  washType: WashType;
  itemCount: number;
  orderIds: string[];
  status: 'washing' | 'completed';
  startedAt: string;
  completedAt?: string;
  operator: string;
  remark?: string;
}

export interface RewashRecord {
  id: string;
  orderId: string;
  itemId: string;
  reason: string;
  photos?: string[];
  operator: string;
  createdAt: string;
  remark?: string;
}

export type HandoverType = 'receive' | 'deliver';

export interface HandoverRecord {
  id: string;
  type: HandoverType;
  orderId: string;
  storeId: string;
  storeName: string;
  itemCount: number;
  operator: string;
  receiver: string;
  signature?: string;
  photos?: string[];
  createdAt: string;
  remark?: string;
}

export type ComplaintStatus = 'pending' | 'investigating' | 'approved' | 'rejected' | 'resolved';

export interface Complaint {
  id: string;
  orderId: string;
  itemId?: string;
  orderNo: string;
  storeName: string;
  customerName: string;
  itemName: string;
  type: 'damage' | 'stain' | 'lost' | 'delay' | 'others';
  description: string;
  photos?: string[];
  requestedCompensation: number;
  approvedCompensation?: number;
  status: ComplaintStatus;
  handler?: string;
  handlerRemark?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface StatusHistory {
  id: string;
  orderId: string;
  itemId?: string;
  fromStatus: string;
  toStatus: string;
  operator: string;
  remark?: string;
  createdAt: string;
}

export interface SettlementItem {
  orderNo: string;
  storeName: string;
  customerName: string;
  itemCount: number;
  orderAmount: number;
  compensationAmount: number;
  netAmount: number;
  status: 'pending' | 'confirmed';
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface MonthlySettlement {
  id: string;
  month: string;
  storeId: string;
  storeName: string;
  totalOrders: number;
  totalItems: number;
  totalAmount: number;
  totalCompensation: number;
  netAmount: number;
  items: SettlementItem[];
  status: 'draft' | 'pending' | 'confirmed' | 'completed';
  factoryConfirmedBy?: string;
  factoryConfirmedAt?: string;
  storeConfirmedBy?: string;
  storeConfirmedAt?: string;
}
