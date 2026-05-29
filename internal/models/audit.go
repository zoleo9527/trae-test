package models

import (
	"time"
)

type AuditAction string

const (
	ActionCreate   AuditAction = "create"
	ActionUpdate   AuditAction = "update"
	ActionDelete   AuditAction = "delete"
	ActionApprove  AuditAction = "approve"
	ActionReject   AuditAction = "reject"
	ActionSubmit   AuditAction = "submit"
	ActionStatus   AuditAction = "status_change"
	ActionPhase    AuditAction = "phase_change"
	ActionLogin    AuditAction = "login"
	ActionLogout   AuditAction = "logout"
	ActionExport   AuditAction = "export"
	ActionImport   AuditAction = "import"
	ActionDownload AuditAction = "download"
)

type ResourceType string

const (
	ResourceUser         ResourceType = "user"
	ResourceProject      ResourceType = "project"
	ResourceCertificate  ResourceType = "certificate"
	ResourceMaterial     ResourceType = "material"
	ResourceInspection   ResourceType = "inspection"
	ResourceTeardown     ResourceType = "teardown_review"
	ResourceSupplier     ResourceType = "supplier"
	ResourceTask         ResourceType = "task"
)

type AuditLog struct {
	BaseModel
	OperatorID   uint         `gorm:"index;not null" json:"operator_id"`
	Operator     User         `gorm:"foreignKey:OperatorID" json:"operator,omitempty"`
	Action       AuditAction  `gorm:"size:30;not null;index" json:"action"`
	ResourceType ResourceType `gorm:"size:30;not null;index" json:"resource_type"`
	ResourceID   uint         `gorm:"index" json:"resource_id"`
	ProjectID    *uint        `gorm:"index" json:"project_id"`
	Project      *Project     `gorm:"foreignKey:ProjectID" json:"project,omitempty"`

	IPAddress   string `gorm:"size:50" json:"ip_address"`
	UserAgent   string `gorm:"size:500" json:"user_agent"`

	OldValues   map[string]interface{} `gorm:"type:json" json:"old_values,omitempty"`
	NewValues   map[string]interface{} `gorm:"type:json" json:"new_values,omitempty"`
	ChangeLog   string                 `gorm:"type:text" json:"change_log"`
	Remarks     string                 `gorm:"type:text" json:"remarks"`
}

type Task struct {
	BaseModel
	ProjectID   uint       `gorm:"index" json:"project_id"`
	Project     Project    `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	Title       string     `gorm:"size:200;not null" json:"title"`
	Description string     `gorm:"type:text" json:"description"`
	Status      TaskStatus `gorm:"size:20;default:todo" json:"status"`
	Priority    int        `gorm:"default:1" json:"priority"`
	Category    string     `gorm:"size:100" json:"category"`

	AssigneeID  *uint      `gorm:"index" json:"assignee_id"`
	Assignee    *User      `gorm:"foreignKey:AssigneeID" json:"assignee,omitempty"`
	CreatorID   uint       `gorm:"index" json:"creator_id"`
	Creator     User       `gorm:"foreignKey:CreatorID" json:"creator,omitempty"`

	DueDate     *time.Time `json:"due_date"`
	CompletedAt *time.Time `json:"completed_at"`

	Attachments []string   `gorm:"type:json" json:"attachments"`
	Remarks     string     `gorm:"type:text" json:"remarks"`
}

type AsyncJob struct {
	BaseModel
	Type       string                 `gorm:"size:50;index;not null" json:"type"`
	Status     string                 `gorm:"size:20;index;default:pending" json:"status"`
	Priority   int                    `gorm:"default:1" json:"priority"`
	Payload    map[string]interface{} `gorm:"type:json" json:"payload"`
	Result     map[string]interface{} `gorm:"type:json" json:"result"`
	Error      string                 `gorm:"type:text" json:"error"`
	StartedAt  *time.Time             `json:"started_at"`
	FinishedAt *time.Time             `json:"finished_at"`
	Retries    int                    `gorm:"default:0" json:"retries"`
	OperatorID uint                   `gorm:"index" json:"operator_id"`
	Operator   User                   `gorm:"foreignKey:OperatorID" json:"operator,omitempty"`
}
