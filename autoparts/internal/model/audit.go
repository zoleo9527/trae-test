package model

type AuditAction string

const (
	AuditActionCreate  AuditAction = "create"
	AuditActionUpdate  AuditAction = "update"
	AuditActionDelete  AuditAction = "delete"
	AuditActionStatus  AuditAction = "status"
	AuditActionLock    AuditAction = "lock"
	AuditActionUnlock  AuditAction = "unlock"
	AuditActionPick    AuditAction = "pick"
	AuditActionReturn  AuditAction = "return"
	AuditActionExport  AuditAction = "export"
	AuditActionApprove AuditAction = "approve"
	AuditActionReject  AuditAction = "reject"
)

type AuditLog struct {
	BaseModel
	UserID      uint        `gorm:"index;not null" json:"user_id"`
	User        *User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	UserName    string      `gorm:"size:50;not null" json:"user_name"`
	Action      AuditAction `gorm:"size:20;index;not null" json:"action"`
	Module      string      `gorm:"size:50;index;not null" json:"module"`
	RecordID    uint        `gorm:"index;not null" json:"record_id"`
	RecordNo    string      `gorm:"size:50;index" json:"record_no"`
	FieldName   string      `gorm:"size:50" json:"field_name"`
	OldValue    string      `gorm:"type:text" json:"old_value"`
	NewValue    string      `gorm:"type:text" json:"new_value"`
	IPAddress   string      `gorm:"size:50" json:"ip_address"`
	UserAgent   string      `gorm:"size:255" json:"user_agent"`
	Remark      string      `gorm:"type:text" json:"remark"`
}
