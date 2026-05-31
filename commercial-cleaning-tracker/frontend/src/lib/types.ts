export type UserRole = 'scheduler' | 'worker' | 'inspector' | 'manager';

export interface User {
	id: number;
	username: string;
	name: string;
	role: UserRole;
	phone: string;
}

export interface Project {
	id: number;
	name: string;
	address: string;
	customerName: string;
	customerPhone: string;
	contractStart: string;
	contractEnd: string;
	status: string;
}

export type ScheduleStatus = 'draft' | 'published' | 'completed';
export type ShiftType = 'morning' | 'afternoon' | 'night' | 'full';

export interface Shift {
	id: number;
	scheduleId: number;
	workerId: number;
	worker: User;
	date: string;
	shiftType: ShiftType;
	startTime: string;
	endTime: string;
	area: string;
	tasks: string;
	checkIns: CheckIn[];
	inspections: Inspection[];
	materialReqs: MaterialRequisition[];
}

export interface Schedule {
	id: number;
	projectId: number;
	project: Project;
	weekStart: string;
	weekEnd: string;
	status: ScheduleStatus;
	createdBy: number;
	shifts: Shift[];
}

export type CheckInStatus = 'normal' | 'late' | 'early' | 'missing' | 'exception';

export interface CheckIn {
	id: number;
	shiftId: number;
	workerId: number;
	worker: User;
	checkInTime: string | null;
	checkOutTime: string | null;
	status: CheckInStatus;
	photoURL: string;
	location: string;
	remark: string;
	isCorrected: boolean;
	correctNote: string;
}

export type InspectionResult = 'pass' | 'fail' | 'pending';

export interface Inspection {
	id: number;
	shiftId: number;
	inspectorId: number;
	inspector: User;
	inspectTime: string;
	result: InspectionResult;
	score: number;
	items: string;
	problems: string;
	photoURLs: string;
	remark: string;
	rectification: Rectification | null;
}

export type RectificationStatus = 'open' | 'assigned' | 'in_progress' | 'done' | 'verified';

export interface Rectification {
	id: number;
	inspectionId: number;
	assigneeId: number;
	assignee: User;
	deadline: string;
	status: RectificationStatus;
	description: string;
	actions: string;
	completedTime: string | null;
	completedNote: string;
	verifiedBy: number | null;
	verifiedTime: string | null;
	verifyNote: string;
}

export type MaterialStatus = 'pending' | 'approved' | 'rejected' | 'issued';

export interface MaterialRequisition {
	id: number;
	shiftId: number;
	requesterId: number;
	requester: User;
	items: string;
	totalQty: number;
	status: MaterialStatus;
	requestTime: string;
	approvedBy: number | null;
	approveTime: string | null;
	issueTime: string | null;
	remark: string;
}

export type FollowUpType = 'rectification' | 'renewal' | 'complaint';
export type FollowUpStatus = 'pending' | 'done';

export interface FollowUp {
	id: number;
	projectId: number | null;
	rectificationId: number | null;
	type: FollowUpType;
	title: string;
	content: string;
	assigneeId: number;
	assignee: User;
	dueDate: string;
	status: FollowUpStatus;
	result: string;
	completedTime: string | null;
	createdBy: number;
}

export interface TraceChain {
	id: number;
	shiftId: number;
	shiftDate: string;
	workerName: string;
	projectName: string;
	projectId: number;
	checkInStatus: string;
	inspectionResult: string;
	hasRectification: boolean;
	rectificationStatus: string;
	rectificationId: number | null;
	materialStatus: string;
	hasFollowUp: boolean;
	followUpCount: number;
	followUpTypes: string[];
}

export interface DashboardStats {
	totalShifts: number;
	missingCheckIns: number;
	lateCheckIns: number;
	pendingRects: number;
	pendingMaterials: number;
	pendingFollowUps: number;
	avgInspectionScore: number;
}
