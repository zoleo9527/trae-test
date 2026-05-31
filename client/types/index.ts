export type UserRole = 'project_manager' | 'scheduling_specialist' | 'quality_inspector'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar: string
  phone: string
}

export interface Project {
  id: string
  name: string
  address: string
  clientName: string
  clientPhone: string
  contractStartDate: string
  contractEndDate: string
  status: 'active' | 'expiring' | 'ended'
  weeklyCleaningDays: number
  assignedStaff: string[]
  note: string
}

export interface Staff {
  id: string
  name: string
  phone: string
  position: 'cleaner' | 'supervisor'
  hireDate: string
  status: 'active' | 'leave'
  projects: string[]
}

export interface Schedule {
  id: string
  projectId: string
  staffId: string
  date: string
  startTime: string
  endTime: string
  taskType: 'daily' | 'deep' | 'special'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  note: string
}

export interface PunchRecord {
  id: string
  scheduleId: string
  projectId: string
  staffId: string
  date: string
  checkInTime: string | null
  checkOutTime: string | null
  checkInPhoto: string | null
  checkOutPhoto: string | null
  status: 'normal' | 'late' | 'early_leave' | 'absent' | 'pending'
  locationVerified: boolean
  note: string
}

export interface QualityInspection {
  id: string
  projectId: string
  inspectorId: string
  date: string
  score: number
  items: InspectionItem[]
  overallStatus: 'excellent' | 'good' | 'pass' | 'fail'
  photos: string[]
  rectificationRequired: boolean
  rectificationDeadline: string | null
  rectificationStatus: 'none' | 'pending' | 'completed' | 'overdue'
  note: string
}

export interface InspectionItem {
  name: string
  score: number
  maxScore: number
  passed: boolean
  note: string
}

export interface Supply {
  id: string
  name: string
  category: 'detergent' | 'tool' | 'disposable' | 'protective'
  unit: string
  currentStock: number
  safeStock: number
  warningStock: number
  lastRestockDate: string | null
  lastRestockQuantity: number
  unitPrice: number
  supplier: string
  note: string
}

export interface SupplyRequisition {
  id: string
  projectId: string
  applicantId: string
  applicationDate: string
  items: RequisitionItem[]
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'delivered' | 'completed'
  approverId: string | null
  approvalDate: string | null
  deliveryDate: string | null
  rejectReason: string | null
  note: string
}

export interface RequisitionItem {
  supplyId: string
  supplyName: string
  quantity: number
  deliveredQuantity: number | null
  unitPrice: number | null
}

export type AlertType = 'missing_punch' | 'rectification' | 'low_stock' | 'contract_expiry' | 'overdue_task'
export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertStatus = 'open' | 'in_progress' | 'resolved'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  title: string
  description: string
  relatedId: string
  relatedType: string
  projectId: string | null
  assigneeId: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  resolutionNote: string | null
  history: AlertHistoryItem[]
}

export interface AlertHistoryItem {
  status: AlertStatus
  note: string
  operatorId: string
  timestamp: string
}

export interface RectificationRecord {
  id: string
  inspectionId: string
  projectId: string
  deadline: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  items: RectificationItem[]
  assigneeId: string | null
  completedDate: string | null
  photos: string[]
  note: string
}

export interface RectificationItem {
  description: string
  completed: boolean
  completedDate: string | null
  note: string
}

export interface CalendarEvent {
  id: string
  date: string
  type: 'schedule' | 'punch' | 'inspection' | 'requisition' | 'alert'
  title: string
  description: string
  status: string
  color: string
  relatedId: string
  projectId: string
}

export interface FilterOptions {
  dateRange: [string, string] | null
  projectIds: string[]
  statuses: string[]
  types: string[]
  searchText: string
}
