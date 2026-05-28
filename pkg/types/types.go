package types

type Role string

const (
	RoleAdmin            Role = "admin"
	RoleStationMaster    Role = "station_master"
	RoleDriver           Role = "driver"
	RoleCustomerService  Role = "customer_service"
)

type ComplaintStatus string

const (
	ComplaintStatusPending    ComplaintStatus = "pending"
	ComplaintStatusProcessing ComplaintStatus = "processing"
	ComplaintStatusResolved   ComplaintStatus = "resolved"
	ComplaintStatusClosed     ComplaintStatus = "closed"
	ComplaintStatusRejected   ComplaintStatus = "rejected"
)

type ComplaintType string

const (
	ComplaintTypeMissingDelivery  ComplaintType = "missing_delivery"
	ComplaintTypeDamagedBucket    ComplaintType = "damaged_bucket"
	ComplaintTypeWrongProduct     ComplaintType = "wrong_product"
	ComplaintTypeLateDelivery     ComplaintType = "late_delivery"
	ComplaintTypeEmptyBucketIssue ComplaintType = "empty_bucket_issue"
	ComplaintTypeQualityIssue     ComplaintType = "quality_issue"
	ComplaintTypeOther            ComplaintType = "other"
)

type RedeliveryStatus string

const (
	RedeliveryStatusScheduled RedeliveryStatus = "scheduled"
	RedeliveryStatusInTransit RedeliveryStatus = "in_transit"
	RedeliveryStatusDelivered RedeliveryStatus = "delivered"
	RedeliveryStatusFailed    RedeliveryStatus = "failed"
	RedeliveryStatusCancelled RedeliveryStatus = "cancelled"
)

type CompensationStatus string

const (
	CompensationStatusPending  CompensationStatus = "pending"
	CompensationStatusApproved CompensationStatus = "approved"
	CompensationStatusRejected CompensationStatus = "rejected"
	CompensationStatusPaid     CompensationStatus = "paid"
)

type CompensationType string

const (
	CompensationTypeRefund      CompensationType = "refund"
	CompensationTypeFreeBucket  CompensationType = "free_bucket"
	CompensationTypeDiscount    CompensationType = "discount"
	CompensationTypeWaterTicket CompensationType = "water_ticket"
)

type TaskType string

const (
	TaskTypePhotoVerification TaskType = "photo_verification"
	TaskTypeStatusNotify      TaskType = "status_notify"
	TaskTypeMonthlyReconcile  TaskType = "monthly_reconcile"
)

type TaskStatus string

const (
	TaskStatusPending   TaskStatus = "pending"
	TaskStatusRunning   TaskStatus = "running"
	TaskStatusCompleted TaskStatus = "completed"
	TaskStatusFailed    TaskStatus = "failed"
)

type AuditAction string

const (
	AuditActionCreate       AuditAction = "create"
	AuditActionUpdate       AuditAction = "update"
	AuditActionStatusChange AuditAction = "status_change"
	AuditActionDelete       AuditAction = "delete"
	AuditActionUpload       AuditAction = "upload"
	AuditActionApprove      AuditAction = "approve"
	AuditActionReject       AuditAction = "reject"
	AuditActionAssign       AuditAction = "assign"
	AuditActionCreateNote   AuditAction = "create_note"
)
