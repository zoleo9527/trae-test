export type Role = 'reception' | 'coach_manager' | 'venue_manager' | 'coach';

export interface User {
	id: string;
	username: string;
	name: string;
	role: Role;
	createdAt: string;
	updatedAt: string;
}

export interface Member {
	id: string;
	name: string;
	phone: string;
	level: string;
	joinDate: string;
	totalSpent: number;
	totalVisits: number;
	wallet?: Wallet;
}

export interface Wallet {
	id: string;
	memberId: string;
	balance: number;
	totalRecharged: number;
}

export interface WalletRecord {
	id: string;
	walletId: string;
	memberId: string;
	bookingId?: string;
	type: string;
	amount: number;
	balanceBefore: number;
	balanceAfter: number;
	operatorId: string;
	remark: string;
	createdAt: string;
}

export interface Bay {
	id: string;
	bayNumber: string;
	type: string;
	floor: number;
	status: string;
	hourlyRate: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'no_show' | 'cancelled' | 'exception';

export interface Booking {
	id: string;
	memberId: string;
	bayId: string;
	coachId?: string;
	scheduleId?: string;
	memberName: string;
	memberPhone: string;
	bayNumber: string;
	coachName?: string;
	startAt: string;
	endAt: string;
	durationHours: number;
	status: BookingStatus;
	totalAmount: number;
	paidAmount: number;
	paymentMethod?: string;
	guestCount: number;
	includeCoaching: boolean;
	checkInTime?: string;
	checkOutTime?: string;
	remark?: string;
	operatorId: string;
	operatorName: string;
	createdAt: string;
	updatedAt: string;
	member?: Member;
	bay?: Bay;
	coach?: User;
	exceptions?: Exception[];
	equipmentRentals?: EquipmentRental[];
	walletRecords?: WalletRecord[];
	auditLogs?: AuditLog[];
}

export interface CoachSchedule {
	id: string;
	coachId: string;
	coachName: string;
	date: string;
	startAt: string;
	endAt: string;
	type: string;
	status: string;
	capacity: number;
	bookedCount: number;
	remark?: string;
	bookings?: Booking[];
}

export interface Equipment {
	id: string;
	name: string;
	category: string;
	brand: string;
	serialNumber: string;
	status: string;
	condition: string;
	dailyRate: number;
}

export interface EquipmentRental {
	id: string;
	bookingId: string;
	equipmentId: string;
	memberId: string;
	equipmentName: string;
	rentedAt: string;
	returnedAt?: string;
	conditionOut: string;
	conditionIn?: string;
	damageReported: boolean;
	damageNote?: string;
	fee: number;
	operatorId: string;
}

export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ExceptionStatus = 'open' | 'investigating' | 'resolved' | 'closed';
export type ExceptionType = 'no_show' | 'late' | 'overstay' | 'payment_issue' | 'equipment_damage' | 'complaint' | 'schedule_conflict' | 'bay_issue' | 'other';

export interface Exception {
	id: string;
	bookingId: string;
	reportedById: string;
	reportedByName: string;
	type: ExceptionType;
	severity: ExceptionSeverity;
	status: ExceptionStatus;
	title: string;
	description: string;
	resolution?: string;
	refundAmount?: number;
	penaltyAmount?: number;
	resolvedById?: string;
	resolvedByName?: string;
	resolvedAt?: string;
	createdAt: string;
	updatedAt: string;
	followUps?: ExceptionFollowUp[];
}

export interface ExceptionFollowUp {
	id: string;
	exceptionId: string;
	operatorId: string;
	operatorName: string;
	note: string;
	createdAt: string;
}

export interface AuditLog {
	id: string;
	bookingId?: string;
	memberId?: string;
	userId: string;
	userName: string;
	action: string;
	entityType: string;
	entityId: string;
	oldValue?: string;
	newValue?: string;
	ipAddress?: string;
	createdAt: string;
}

export interface AuthResponse {
	token: string;
	user: User;
}

export interface CreateBookingRequest {
	memberId: string;
	bayId: string;
	coachId?: string;
	startAt: string;
	endAt: string;
	guestCount: number;
	includeCoaching: boolean;
	paymentMethod: string;
	remark?: string;
}

export interface ExceptionRequest {
	type: ExceptionType;
	severity: ExceptionSeverity;
	title: string;
	description: string;
}

export interface ResolveExceptionRequest {
	resolution: string;
	refundAmount: number;
	penaltyAmount: number;
	status: ExceptionStatus;
}

export const STATUS_COLORS: Record<BookingStatus, string> = {
	pending: 'bg-yellow-100 text-yellow-800',
	confirmed: 'bg-blue-100 text-blue-800',
	checked_in: 'bg-green-100 text-green-800',
	completed: 'bg-gray-100 text-gray-800',
	no_show: 'bg-red-100 text-red-800',
	cancelled: 'bg-gray-100 text-gray-600',
	exception: 'bg-orange-100 text-orange-800'
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
	pending: '待确认',
	confirmed: '已确认',
	checked_in: '已到场',
	completed: '已完成',
	no_show: '未到场',
	cancelled: '已取消',
	exception: '异常'
};

export const EXCEPTION_SEVERITY_COLORS: Record<ExceptionSeverity, string> = {
	low: 'bg-gray-100 text-gray-800',
	medium: 'bg-yellow-100 text-yellow-800',
	high: 'bg-red-100 text-red-800',
	critical: 'bg-purple-100 text-purple-800'
};

export const EXCEPTION_SEVERITY_LABELS: Record<ExceptionSeverity, string> = {
	low: '低',
	medium: '中',
	high: '高',
	critical: '紧急'
};

export const EXCEPTION_STATUS_COLORS: Record<ExceptionStatus, string> = {
	open: 'bg-red-100 text-red-800',
	investigating: 'bg-yellow-100 text-yellow-800',
	resolved: 'bg-green-100 text-green-800',
	closed: 'bg-gray-100 text-gray-800'
};

export const EXCEPTION_STATUS_LABELS: Record<ExceptionStatus, string> = {
	open: '待处理',
	investigating: '处理中',
	resolved: '已解决',
	closed: '已关闭'
};

export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
	no_show: '未到场',
	late: '迟到',
	overstay: '超时停留',
	payment_issue: '支付问题',
	equipment_damage: '器材损坏',
	complaint: '客户投诉',
	schedule_conflict: '排班冲突',
	bay_issue: '打位故障',
	other: '其他'
};

export const ROLE_LABELS: Record<Role, string> = {
	reception: '前台',
	coach_manager: '教练主管',
	venue_manager: '场馆经理',
	coach: '教练'
};
