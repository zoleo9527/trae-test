export type Role = 'manager' | 'planner' | 'warehouse';

export interface User {
	id: string;
	username: string;
	name: string;
	role: Role;
	avatar: string;
	createdAt: string;
	updatedAt: string;
}

export type ProductStatus = 'draft' | 'pending' | 'approved' | 'on_shelf' | 'off_shelf' | 'rejected' | 'reviewing';

export interface CollabProduct {
	id: string;
	sku: string;
	name: string;
	brandPartner: string;
	category: string;
	retailPrice: number;
	costPrice: number;
	description: string;
	imageUrl: string;
	status: ProductStatus;
	planOnShelfDate: string;
	planOffShelfDate: string;
	actualOnShelfDate?: string;
	actualOffShelfDate?: string;
	targetStores: string[];
	createdBy: string;
	createdByName: string;
	approvedBy?: string;
	approvedByName?: string;
	rejectReason?: string;
	reviewNote?: string;
	totalSales: number;
	totalRevenue: number;
	createdAt: string;
	updatedAt: string;
}

export interface Store {
	id: string;
	code: string;
	name: string;
	region: string;
	manager: string;
	phone: string;
	address: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Inventory {
	id: string;
	productId: string;
	storeId: string;
	storeCode: string;
	quantity: number;
	reservedQty: number;
	availableQty: number;
	lastCountDate?: string;
	lastCountQty: number;
	deviationQty: number;
	createdAt: string;
	updatedAt: string;
}

export type OrderType = 'restock' | 'transfer' | 'exchange';
export type OrderStatus = 'draft' | 'pending' | 'approved' | 'shipped' | 'received' | 'rejected' | 'completed';

export interface Order {
	id: string;
	orderNo: string;
	type: OrderType;
	status: OrderStatus;
	productId: string;
	productSku: string;
	productName: string;
	fromStoreId?: string;
	fromStoreCode?: string;
	toStoreId: string;
	toStoreCode: string;
	quantity: number;
	memberPhone?: string;
	memberName?: string;
	exchangePoints?: number;
	remark?: string;
	createdBy: string;
	createdByName: string;
	approvedBy?: string;
	approvedByName?: string;
	rejectReason?: string;
	shippedAt?: string;
	receivedAt?: string;
	createdAt: string;
	updatedAt: string;
}

export type InspectionStatus = 'pending' | 'passed' | 'exception' | 'closed';

export interface Inspection {
	id: string;
	productId: string;
	productSku: string;
	productName: string;
	storeId: string;
	storeCode: string;
	storeName: string;
	status: InspectionStatus;
	displayCorrect: boolean;
	displayPosition: string;
	photoUrls: string[];
	inventoryCheck: boolean;
	expectedQty: number;
	actualQty: number;
	deviationQty: number;
	issues: string[];
	inspectorId: string;
	inspectorName: string;
	remark?: string;
	followUpBy?: string;
	followUpByName?: string;
	followUpNote?: string;
	closedAt?: string;
	createdAt: string;
	updatedAt: string;
}

export type ExceptionType = 'inventory' | 'display' | 'timing' | 'order' | 'other';
export type ExceptionStatus = 'open' | 'handling' | 'resolved' | 'review';

export interface ExceptionRecord {
	id: string;
	type: ExceptionType;
	title: string;
	description: string;
	status: ExceptionStatus;
	severity: 'low' | 'medium' | 'high';
	productId?: string;
	productSku?: string;
	productName?: string;
	storeId?: string;
	storeCode?: string;
	storeName?: string;
	orderId?: string;
	orderNo?: string;
	inspectionId?: string;
	reportedBy: string;
	reportedByName: string;
	assignedTo?: string;
	assignedToName?: string;
	resolutionNote?: string;
	needReview: boolean;
	resolvedAt?: string;
	reviewNote?: string;
	reviewedBy?: string;
	reviewedByName?: string;
	reviewedAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface OperationLog {
	id: string;
	entityType: string;
	entityId: string;
	action: string;
	oldValue?: string;
	newValue?: string;
	remark?: string;
	operatorId: string;
	operatorName: string;
	operatorRole: Role;
	createdAt: string;
}

export interface ReviewRecord {
	id: string;
	productId: string;
	productSku: string;
	productName: string;
	reviewType: string;
	totalQuantity: number;
	totalSales: number;
	totalRevenue: number;
	inventoryLeft: number;
	displayScore: number;
	timingScore: number;
	salesScore: number;
	overallScore: number;
	problems: string[];
	lessons: string[];
	improvements: string[];
	reviewedBy: string;
	reviewedByName: string;
	reviewedAt: string;
	createdAt: string;
}

export interface DashboardStats {
	pendingApproval: number;
	rejectedItems: number;
	needReview: number;
	openExceptions: number;
	onShelfProducts: number;
	pendingInspection: number;
}

export interface PendingItem {
	id: string;
	type: string;
	title: string;
	status: string;
	createdAt: string;
	createdBy: string;
	description: string;
}

export interface DashboardData {
	stats: DashboardStats;
	pendingItems: PendingItem[];
	rejectedItems: PendingItem[];
	needReviewItems: PendingItem[];
}
