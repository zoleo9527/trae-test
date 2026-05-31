export type UserRole = 'manager' | 'coach_supervisor' | 'reception'

export type RecordStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'overdue'

export type ComplaintCategory = 'equipment' | 'service' | 'course_condition' | 'booking' | 'other'
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent'

export type BookingType = 'driving_range' | 'putting_green' | 'chipping_area' | 'lesson'
export type PaymentMethod = 'prepaid' | 'cash' | 'card' | 'points'

export type EquipmentCategory = 'club' | 'bag' | 'cart' | 'range_finder' | 'umbrella' | 'other'
export type EquipmentStatus = 'available' | 'borrowed' | 'maintenance' | 'lost' | 'damaged'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar?: string
  phone: string
  email?: string
  permissions: string[]
}

export interface Customer {
  id: string
  name: string
  phone: string
  memberLevel: 'normal' | 'silver' | 'gold' | 'platinum'
  joinDate: string
  totalSpent: number
  notes?: string
}

export interface StatusHistory {
  id: string
  recordId: string
  fromStatus: RecordStatus | null
  toStatus: RecordStatus
  operatorId: string
  operatorName: string
  operatorRole?: UserRole
  remark?: string
  createdAt: string
}

export interface Remark {
  id: string
  recordId: string
  content: string
  authorId: string
  authorName: string
  authorRole: UserRole
  isInternal: boolean
  createdAt: string
  attachments?: string[]
}

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  relatedId?: string
  relatedType?: 'patrol' | 'complaint' | 'booking' | 'equipment' | 'prepaid'
  recipientRole: UserRole[]
  read: boolean
  createdAt: string
}

export interface PatrolRecord {
  id: string
  patrolNo: string
  date: string
  startTime: string
  endTime?: string
  location: string
  weather: string
  temperature: number
  operatorId: string
  operatorName: string
  supervisorId?: string
  supervisorName?: string
  status: RecordStatus
  items: PatrolItem[]
  issues: PatrolIssue[]
  summary?: string
  createdAt: string
  updatedAt: string
}

export interface PatrolItem {
  id: string
  name: string
  category: 'fairway' | 'green' | 'tee' | 'bunker' | 'facility' | 'equipment' | 'safety'
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  description?: string
  photoUrls?: string[]
}

export interface PatrolIssue {
  id: string
  description: string
  severity: 'low' | 'medium' | 'high'
  category: 'maintenance' | 'safety' | 'service' | 'other'
  status: 'open' | 'in_progress' | 'resolved'
  assigneeId?: string
  assigneeName?: string
  resolvedAt?: string
  resolution?: string
  relatedComplaintId?: string
}

export interface Complaint {
  id: string
  complaintNo: string
  customerId: string
  customerName: string
  customerPhone: string
  category: ComplaintCategory
  priority: ComplaintPriority
  title: string
  description: string
  source: 'phone' | 'on_site' | 'wechat' | 'online' | 'other'
  status: RecordStatus
  handlerId?: string
  handlerName?: string
  supervisorId?: string
  supervisorName?: string
  relatedBookingId?: string
  relatedPatrolId?: string
  relatedEquipmentId?: string
  timeline: ComplaintTimeline[]
  createdAt: string
  updatedAt: string
  expectedResolveDate?: string
  actualResolveDate?: string
}

export interface ComplaintTimeline {
  id: string
  action: 'created' | 'assigned' | 'investigating' | 'resolving' | 'resolved' | 'rejected' | 'follow_up'
  description: string
  operatorId: string
  operatorName: string
  operatorRole: UserRole
  createdAt: string
}

export interface Booking {
  id: string
  bookingNo: string
  customerId: string
  customerName: string
  customerPhone: string
  type: BookingType
  bayNumber?: string
  holeNumber?: string
  date: string
  startTime: string
  endTime: string
  duration: number
  status: RecordStatus
  numberOfPeople: number
  equipmentRentals: EquipmentRental[]
  fees: BookingFee[]
  totalAmount: number
  prepaidDeducted: number
  paymentMethod: PaymentMethod
  paid: boolean
  checkInTime?: string
  checkOutTime?: string
  noShow: boolean
  remark?: string
  operatorId: string
  operatorName: string
  createdAt: string
  updatedAt: string
}

export interface EquipmentRental {
  id: string
  equipmentId: string
  equipmentName: string
  quantity: number
  rentalFee: number
  pickedUp: boolean
  pickedUpAt?: string
  returned: boolean
  returnedAt?: string
  returnedCondition?: 'good' | 'damaged' | 'missing'
  returnCheckBy?: string
}

export interface BookingFee {
  id: string
  name: string
  category: 'green_fee' | 'range_ball' | 'rental' | 'lesson' | 'other'
  amount: number
  prepaidApplicable: boolean
  description?: string
}

export interface PrepaidAccount {
  id: string
  accountNo: string
  customerId: string
  customerName: string
  customerPhone: string
  balance: number
  totalRecharged: number
  totalConsumed: number
  frozenAmount: number
  status: 'active' | 'frozen' | 'closed'
  level: 'normal' | 'silver' | 'gold' | 'platinum'
  discountRate: number
  pointBalance: number
  transactions: PrepaidTransaction[]
  createdAt: string
  updatedAt: string
  expireDate?: string
}

export interface PrepaidTransaction {
  id: string
  transactionNo: string
  accountId: string
  type: 'recharge' | 'consume' | 'refund' | 'adjust' | 'freeze' | 'unfreeze'
  amount: number
  balanceBefore: number
  balanceAfter: number
  relatedBookingId?: string
  relatedBookingNo?: string
  consumptionDetail?: string
  operatorId: string
  operatorName: string
  remark?: string
  createdAt: string
}

export interface Equipment {
  id: string
  equipmentNo: string
  name: string
  category: EquipmentCategory
  brand?: string
  model?: string
  serialNumber?: string
  purchaseDate?: string
  purchasePrice?: number
  status: EquipmentStatus
  condition: 'new' | 'good' | 'fair' | 'poor' | 'damaged'
  location: string
  rentalFee: number
  deposit: number
  currentBorrowerId?: string
  currentBorrowerName?: string
  currentBookingId?: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  maintenanceRecords: MaintenanceRecord[]
  borrowHistory: BorrowRecord[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MaintenanceRecord {
  id: string
  equipmentId: string
  type: 'routine' | 'repair' | 'inspection'
  description: string
  cost?: number
  operatorId: string
  operatorName: string
  date: string
  result: 'completed' | 'pending' | 'cancelled'
}

export interface BorrowRecord {
  id: string
  equipmentId: string
  equipmentName: string
  borrowerId: string
  borrowerName: string
  borrowerPhone: string
  relatedBookingId?: string
  relatedBookingNo?: string
  borrowDate: string
  expectedReturnDate: string
  actualReturnDate?: string
  depositPaid: number
  depositReturned: boolean
  conditionBefore: 'new' | 'good' | 'fair' | 'poor' | 'damaged'
  conditionAfter?: 'new' | 'good' | 'fair' | 'poor' | 'damaged'
  returnedCheckById?: string
  returnedCheckByName?: string
  notes?: string
  status: 'active' | 'returned' | 'overdue' | 'lost'
}

export interface CalendarEvent {
  id: string
  date: string
  type: 'booking' | 'patrol' | 'complaint' | 'equipment_due' | 'maintenance'
  title: string
  description?: string
  startTime?: string
  endTime?: string
  status: RecordStatus
  relatedId: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface FilterOptions {
  dateRange?: [string, string]
  status?: RecordStatus[]
  keyword?: string
  assignee?: string
  category?: string[]
  priority?: ComplaintPriority[]
}

export interface PaginationParams {
  page: number
  pageSize: number
  total: number
}
