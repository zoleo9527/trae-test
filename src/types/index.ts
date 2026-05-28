export type UserRole = 'station_master' | 'driver' | 'customer_service'

export interface PhotoInfo {
  id: string
  url: string
  label: string
  uploadedBy: string
  uploadedAt: string
}

export interface User {
  id: string
  name: string
  role: UserRole
  phone: string
  avatar?: string
}

export type OrderStatus = 'pending' | 'assigned' | 'delivering' | 'completed' | 'cancelled'

export interface Order {
  id: string
  orderNo: string
  customerName: string
  customerPhone: string
  customerAddress: string
  waterQuantity: number
  bucketQuantity: number
  amount: number
  status: OrderStatus
  assignedDriverId?: string
  assignedDriverName?: string
  createdAt: string
  scheduledTime: string
  completedAt?: string
  notes?: string
}

export type DeliveryStatus = 'pending' | 'in_transit' | 'arrived' | 'completed' | 'failed'

export interface Delivery {
  id: string
  deliveryNo: string
  orderId: string
  orderNo: string
  driverId: string
  driverName: string
  customerName: string
  customerPhone: string
  customerAddress: string
  waterQuantity: number
  bucketQuantity: number
  status: DeliveryStatus
  startedAt?: string
  arrivedAt?: string
  completedAt?: string
  signPhotos: PhotoInfo[]
  disputePhotos: PhotoInfo[]
  signName?: string
  signTime?: string
  actualWaterDelivered?: number
  actualBucketsCollected?: number
  disputeNote?: string
  hasDispute: boolean
}

export type BucketReturnStatus = 'pending' | 'collected' | 'disputed' | 'resolved' | 'lost'

export interface BucketReturn {
  id: string
  returnNo: string
  deliveryId: string
  orderId: string
  orderNo: string
  driverId: string
  driverName: string
  customerName: string
  expectedQuantity: number
  actualQuantity: number
  status: BucketReturnStatus
  collectedAt?: string
  photos: PhotoInfo[]
  disputeReason?: string
  resolvedAt?: string
  resolvedBy?: string
  resolution?: string
  bucketLossCount: number
}

export type InventoryType = 'in' | 'out' | 'adjust'

export interface InventoryRecord {
  id: string
  recordNo: string
  type: InventoryType
  itemType: 'water' | 'bucket'
  quantity: number
  beforeQuantity: number
  afterQuantity: number
  relatedOrderId?: string
  relatedDeliveryId?: string
  operatorId: string
  operatorName: string
  operatedAt: string
  notes?: string
}

export interface Inventory {
  id: string
  itemType: 'water' | 'bucket'
  totalQuantity: number
  availableQuantity: number
  damagedQuantity: number
  lastUpdated: string
}

export type ComplaintStatus = 'pending' | 'processing' | 'resolved' | 'closed'
export type ComplaintType = 'delivery_delay' | 'bucket_dispute' | 'water_quality' | 'service_attitude' | 'other'

export interface Complaint {
  id: string
  complaintNo: string
  orderId?: string
  orderNo?: string
  customerName: string
  customerPhone: string
  type: ComplaintType
  description: string
  status: ComplaintStatus
  reportedBy: string
  reportedAt: string
  assignedTo?: string
  assignedToName?: string
  priority: 'low' | 'medium' | 'high'
  hasReDelivery: boolean
  reDeliveryOrderId?: string
  photos: PhotoInfo[]
  resolution?: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface ReDelivery {
  id: string
  reDeliveryNo: string
  originalOrderId: string
  complaintId: string
  newOrderId?: string
  newDeliveryId?: string
  driverId?: string
  driverName?: string
  waterQuantity: number
  status: 'pending' | 'assigned' | 'delivering' | 'completed'
  scheduledTime: string
  createdAt: string
}

export interface DashboardStats {
  todayDeliveries: number
  todayCompleted: number
  pendingComplaints: number
  totalBuckets: number
  availableBuckets: number
  disputedReturns: number
  monthlyRevenue: number
  deliveryCompletionRate: number
}

export interface DailyStats {
  date: string
  deliveries: number
  completed: number
  bucketsCollected: number
  complaints: number
}

export type TimelineActionType = 
  | 'order_created' 
  | 'order_assigned' 
  | 'delivery_started' 
  | 'delivery_arrived' 
  | 'delivery_completed' 
  | 'buckets_collected' 
  | 'dispute_raised' 
  | 'complaint_created' 
  | 'complaint_resolved' 
  | 'redelivery_created' 
  | 'inventory_adjusted'

export interface TimelineEntry {
  id: string
  actionType: TimelineActionType
  relatedId: string
  relatedType: string
  actorId: string
  actorName: string
  actorRole: UserRole
  timestamp: string
  description: string
  details: Record<string, any>
}
