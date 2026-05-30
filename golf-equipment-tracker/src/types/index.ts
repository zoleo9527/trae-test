export type UserRole = "reception" | "coach" | "manager";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type EquipmentStatus = "available" | "borrowed" | "maintenance" | "lost";
export type EquipmentCategory = "club" | "bag" | "cart" | "range_finder" | "shoes" | "umbrella" | "other";

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status: EquipmentStatus;
  condition: "excellent" | "good" | "fair" | "poor";
  purchaseDate?: string;
  lastMaintenanceDate?: string;
  notes?: string;
  deposit: number;
  dailyRate: number;
}

export type BorrowStatus = "pending" | "approved" | "rejected" | "active" | "returned" | "overdue" | "needs_review";
export type ReviewResult = "accepted" | "damaged" | "missing_parts" | "requires_compensation";

export interface BorrowRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCategory: EquipmentCategory;
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  applicantId: string;
  applicantName: string;
  status: BorrowStatus;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  depositAmount: number;
  depositPaid: boolean;
  totalCost?: number;
  approvalNotes?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedReason?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  bookingId?: string;
  memberId?: string;
  memberName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnInspection {
  id: string;
  borrowRecordId: string;
  inspectorId: string;
  inspectorName: string;
  inspectionDate: string;
  overallCondition: "excellent" | "good" | "fair" | "poor";
  result: ReviewResult;
  issuesFound: string[];
  photos?: string[];
  compensationAmount?: number;
  compensationReason?: string;
  notes: string;
  depositReturned: boolean;
  depositReturnAmount?: number;
  createdAt: string;
}

export interface Booking {
  id: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  laneNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  guests: number;
  bucketType: "small" | "medium" | "large";
  bucketCount: number;
  coachId?: string;
  coachName?: string;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  createdAt: string;
}

export interface StoredValueRecord {
  id: string;
  memberId: string;
  memberName: string;
  type: "deposit" | "consume" | "refund";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  relatedType?: "booking" | "equipment" | "lesson" | "other";
  relatedId?: string;
  relatedNote?: string;
  operatorId: string;
  operatorName: string;
  notes?: string;
  createdAt: string;
}

export interface ReviewCase {
  id: string;
  title: string;
  type: "complaint" | "dispute" | "audit" | "damaged_equipment";
  status: "open" | "investigating" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  relatedBorrowIds?: string[];
  relatedBookingIds?: string[];
  relatedMemberId?: string;
  relatedMemberName?: string;
  assigneeId?: string;
  assigneeName?: string;
  description: string;
  timeline: ReviewTimelineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewTimelineItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
}

export interface DashboardStats {
  pendingBorrows: number;
  activeBorrows: number;
  overdueBorrows: number;
  rejectedToday: number;
  pendingReturns: number;
  needsReview: number;
  openCases: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
