export type UserRole = 'scheduler' | 'worker' | 'inspector' | 'manager';

export interface User {
	ID: number;
	Username: string;
	Name: string;
	Role: UserRole;
	Phone: string;
	Avatar: string;
}

export interface Project {
	ID: number;
	Name: string;
	Address: string;
	CustomerName: string;
	CustomerPhone: string;
	ContractStart: string;
	ContractEnd: string;
	Status: string;
	ManagerID: number;
	Manager: User;
}

export type ScheduleStatus = 'draft' | 'published' | 'completed';

export interface Schedule {
	ID: number;
	ProjectID: number;
	Project: Project;
	WeekStart: string;
	WeekEnd: string;
	Status: ScheduleStatus;
	CreatedBy: number;
	Creator: User;
	Shifts: Shift[];
}

export type ShiftType = 'morning' | 'afternoon' | 'night' | 'full';

export interface Shift {
	ID: number;
	ScheduleID: number;
	Schedule: Schedule;
	WorkerID: number;
	Worker: User;
	Date: string;
	ShiftType: ShiftType;
	StartTime: string;
	EndTime: string;
	Area: string;
	Tasks: string;
	CheckIns: CheckIn[];
	Inspections: Inspection[];
	MaterialReqs: MaterialRequisition[];
}

export type CheckInStatus = 'normal' | 'late' | 'early' | 'missing' | 'exception';

export interface CheckIn {
	ID: number;
	ShiftID: number;
	WorkerID: number;
	Worker: User;
	CheckInTime: string | null;
	CheckOutTime: string | null;
	Status: CheckInStatus;
	PhotoURL: string;
	Location: string;
	Remark: string;
	IsCorrected: boolean;
	CorrectedBy: number | null;
	Corrector: User | null;
	CorrectTime: string | null;
	CorrectNote: string;
}

export type InspectionResult = 'pass' | 'fail' | 'pending';

export interface Inspection {
	ID: number;
	ShiftID: number;
	InspectorID: number;
	Inspector: User;
	InspectTime: string;
	Result: InspectionResult;
	Score: number;
	Items: string;
	Problems: string;
	PhotoURLs: string;
	Remark: string;
	Rectification: Rectification | null;
}

export type RectificationStatus = 'open' | 'assigned' | 'in_progress' | 'done' | 'verified';

export interface Rectification {
	ID: number;
	InspectionID: number;
	AssigneeID: number;
	Assignee: User;
	Deadline: string;
	Status: RectificationStatus;
	Description: string;
	Actions: string;
	CompletedTime: string | null;
	CompletedNote: string;
	VerifiedBy: number | null;
	Verifier: User | null;
	VerifiedTime: string | null;
	VerifyNote: string;
	FollowUps: FollowUp[];
}

export type MaterialStatus = 'pending' | 'approved' | 'rejected' | 'issued';

export interface MaterialRequisition {
	ID: number;
	ShiftID: number;
	RequesterID: number;
	Requester: User;
	Items: string;
	TotalQty: number;
	Status: MaterialStatus;
	RequestTime: string;
	ApprovedBy: number | null;
	Approver: User | null;
	ApproveTime: string | null;
	IssueTime: string | null;
	Remark: string;
}

export type FollowUpType = 'rectification' | 'renewal' | 'complaint';
export type FollowUpStatus = 'pending' | 'done';

export interface FollowUp {
	ID: number;
	ProjectID: number | null;
	Project: Project | null;
	RectificationID: number | null;
	Rectification: Rectification | null;
	Type: FollowUpType;
	Title: string;
	Content: string;
	AssigneeID: number;
	Assignee: User;
	DueDate: string;
	Status: FollowUpStatus;
	Result: string;
	CompletedTime: string | null;
	CreatedBy: number;
	Creator: User;
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
