export type UserRole = 'admin' | 'store_owner' | 'rental_consultant' | 'repair_technician';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export type RentalStatus = 'active' | 'returned' | 'overdue';
export type RentalSource = 'retail' | 'school_partner';

export interface RentalItem {
  instrumentId: string;
  instrumentName: string;
  serialNumber: string;
  dailyRate: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface Rental {
  id: string;
  rentalNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  source: RentalSource;
  schoolPartnerId?: string;
  schoolPartnerName?: string;
  items: RentalItem[];
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  depositAmount: number;
  status: RentalStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  notes?: string;
}

export type DamageSeverity = 'minor' | 'moderate' | 'major';
export type LiabilityType = 'customer' | 'wear_and_tear' | 'previous' | 'unknown';

export interface DamageAssessment {
  id: string;
  description: string;
  severity: DamageSeverity;
  photos?: string[];
  estimatedRepairCost: number;
  liability: LiabilityType;
  assessedBy: string;
  assessedByName: string;
  assessedAt: string;
}

export interface Return {
  id: string;
  rentalId: string;
  rentalNumber: string;
  returnedBy: string;
  returnedByName: string;
  returnedAt: string;
  itemsCondition: RentalItem[];
  damages: DamageAssessment[];
  totalRentalDays: number;
  totalRentalFee: number;
  damageDeduction: number;
  netRefund: number;
  status: 'pending_review' | 'reviewed' | 'disputed';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  actualRepairCost?: number;
  actualPartsCost?: number;
  actualLaborCost?: number;
  repairCompletedAt?: string;
}

export type RepairStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface PartUsage {
  partId: string;
  partName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Repair {
  id: string;
  repairNumber: string;
  rentalId?: string;
  returnId?: string;
  instrumentId: string;
  instrumentName: string;
  serialNumber: string;
  customerName?: string;
  type: 'warranty' | 'rental_return' | 'customer_paid';
  status: RepairStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reportedIssues: string[];
  diagnosis?: string;
  laborHours: number;
  laborRate: number;
  partsUsed: PartUsage[];
  totalPartsCost: number;
  totalLaborCost: number;
  totalRepairCost: number;
  assignedTo?: string;
  assignedToName?: string;
  startedAt?: string;
  completedAt?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  notes?: string;
}

export interface SchoolPartner {
  id: string;
  name: string;
  contactPerson: string;
  contactPhone: string;
  billingCycle: 'weekly' | 'biweekly' | 'monthly';
  discountRate: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface SchoolInvoice {
  id: string;
  invoiceNumber: string;
  schoolPartnerId: string;
  schoolPartnerName: string;
  periodStart: string;
  periodEnd: string;
  rentalIds: string[];
  subtotal: number;
  discountAmount: number;
  damageCharges: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  dueDate: string;
  sentAt?: string;
  paidAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: 'rental' | 'return' | 'repair' | 'invoice';
  entityId: string;
  action: string;
  changes: Record<string, { old: any; new: any }>;
  performedBy: string;
  performedByName: string;
  performedAt: string;
}

export type SortDirection = 'asc' | 'desc';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FilterOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
  search?: string;
  [key: string]: any;
}
