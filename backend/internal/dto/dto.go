package dto

import (
	"time"

	"github.com/google/uuid"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string     `json:"token"`
	User  UserSummary `json:"user"`
}

type UserSummary struct {
	ID        uuid.UUID  `json:"id"`
	Username  string     `json:"username"`
	RealName  string     `json:"real_name"`
	Role      string     `json:"role"`
	Phone     string     `json:"phone"`
	ProjectID *uuid.UUID `json:"project_id"`
	TeamID    *uuid.UUID `json:"team_id"`
}

type AttendanceFilter struct {
	ProjectID  string `query:"project_id"`
	TeamID     string `query:"team_id"`
	RecordDate string `query:"record_date"`
	StartDate  string `query:"start_date"`
	EndDate    string `query:"end_date"`
	Status     string `query:"status"`
	WorkerName string `query:"worker_name"`
	WorkArea   string `query:"work_area"`
	Page       int    `query:"page"`
	PageSize   int    `query:"page_size"`
}

type SettlementFilter struct {
	ProjectID string `query:"project_id"`
	TeamID    string `query:"team_id"`
	Status    string `query:"status"`
	StartDate string `query:"start_date"`
	EndDate   string `query:"end_date"`
	Page      int    `query:"page"`
	PageSize  int    `query:"page_size"`
}

type DeliveryFilter struct {
	ProjectID     string `query:"project_id"`
	TeamID        string `query:"team_id"`
	ReceiptStatus string `query:"receipt_status"`
	MaterialName  string `query:"material_name"`
	StartDate     string `query:"start_date"`
	EndDate       string `query:"end_date"`
	Page          int    `query:"page"`
	PageSize      int    `query:"page_size"`
}

type ChangeOrderFilter struct {
	ProjectID  string `query:"project_id"`
	TeamID     string `query:"team_id"`
	Status     string `query:"status"`
	ChangeType string `query:"change_type"`
	Page       int    `query:"page"`
	PageSize   int    `query:"page_size"`
}

type QualityFilter struct {
	ProjectID string `query:"project_id"`
	TeamID    string `query:"team_id"`
	Result    string `query:"result"`
	StartDate string `query:"start_date"`
	EndDate   string `query:"end_date"`
	Page      int    `query:"page"`
	PageSize  int    `query:"page_size"`
}

type ReworkFilter struct {
	ProjectID string `query:"project_id"`
	TeamID    string `query:"team_id"`
	Status    string `query:"status"`
	Page      int    `query:"page"`
	PageSize  int    `query:"page_size"`
}

type AuditFilter struct {
	EntityType string `query:"entity_type"`
	EntityID   string `query:"entity_id"`
	OperatorID string `query:"operator_id"`
	Action     string `query:"action"`
	StartDate  string `query:"start_date"`
	EndDate    string `query:"end_date"`
	Page       int    `query:"page"`
	PageSize   int    `query:"page_size"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}

type GenerateSettlementRequest struct {
	TeamID      string `json:"team_id"`
	ProjectID   string `json:"project_id"`
	PeriodStart string `json:"period_start"`
	PeriodEnd   string `json:"period_end"`
	Remark      string `json:"remark"`
}

type SettlementStatusAction struct {
	Action string `json:"action"`
	Remark string `json:"remark"`
}

type AttendanceCreate struct {
	TeamID          string  `json:"team_id"`
	ProjectID       string  `json:"project_id"`
	RecordDate      string  `json:"record_date"`
	WorkerName      string  `json:"worker_name"`
	WorkerIDCard    string  `json:"worker_id_card"`
	Status          string  `json:"status"`
	HoursWorked     float64 `json:"hours_worked"`
	WorkArea        string  `json:"work_area"`
	TaskDescription string  `json:"task_description"`
	Remark          string  `json:"remark"`
}

type AttendanceUpdate struct {
	Status          *string  `json:"status"`
	HoursWorked     *float64 `json:"hours_worked"`
	WorkArea        *string  `json:"work_area"`
	TaskDescription *string  `json:"task_description"`
	Remark          *string  `json:"remark"`
}

type DeliveryCreate struct {
	ProjectID     string  `json:"project_id"`
	TeamID        string  `json:"team_id"`
	MaterialName  string  `json:"material_name"`
	Specification string  `json:"specification"`
	Quantity      float64 `json:"quantity"`
	Unit          string  `json:"unit"`
	DeliveryDate  string  `json:"delivery_date"`
	ReceivedBy    string  `json:"received_by"`
	ReceiptStatus string  `json:"receipt_status"`
	Remark        string  `json:"remark"`
}

type ChangeOrderCreate struct {
	ProjectID    string  `json:"project_id"`
	TeamID       string  `json:"team_id"`
	ChangeType   string  `json:"change_type"`
	Description  string  `json:"description"`
	BeforeValue  MapJSON `json:"before_value"`
	AfterValue   MapJSON `json:"after_value"`
	ImpactAmount float64 `json:"impact_amount"`
	Remark       string  `json:"remark"`
}

type ChangeOrderConfirm struct {
	Status string `json:"status"`
	Remark string `json:"remark"`
}

type QualityCreate struct {
	ProjectID      string `json:"project_id"`
	TeamID         string `json:"team_id"`
	Area           string `json:"area"`
	InspectionDate string `json:"inspection_date"`
	Result         string `json:"result"`
	IssuesFound    string `json:"issues_found"`
	ReworkRequired bool   `json:"rework_required"`
	Remark         string `json:"remark"`
}

type ReworkCreate struct {
	ProjectID           string  `json:"project_id"`
	TeamID              string  `json:"team_id"`
	QualityInspectionID string  `json:"quality_inspection_id"`
	Reason              string  `json:"reason"`
	Description         string  `json:"description"`
	Cost                float64 `json:"cost"`
	ResponsiblePerson   string  `json:"responsible_person"`
	Remark              string  `json:"remark"`
}

type ReworkStatusUpdate struct {
	Status      string  `json:"status"`
	Cost        *float64 `json:"cost"`
	Remark      string  `json:"remark"`
}

type MapJSON = map[string]interface{}

type TeamCreate struct {
	ProjectID   string `json:"project_id"`
	Name        string `json:"name"`
	LeaderName  string `json:"leader_name"`
	LeaderPhone string `json:"leader_phone"`
	TradeType   string `json:"trade_type"`
}

type ProjectCreate struct {
	Name      string `json:"name"`
	Location  string `json:"location"`
	StartDate string `json:"start_date"`
}

type DashboardStats struct {
	ProjectID           uuid.UUID `json:"project_id"`
	TotalTeams          int64     `json:"total_teams"`
	TotalAttendance     int64     `json:"total_attendance"`
	PendingSettlements  int64     `json:"pending_settlements"`
	PendingDeliveries   int64     `json:"pending_deliveries"`
	PendingChangeOrders int64     `json:"pending_change_orders"`
	OpenReworks         int64     `json:"open_reworks"`
	QualityPassRate     float64   `json:"quality_pass_rate"`
	TotalSettlementAmount float64 `json:"total_settlement_amount"`
	RecentAuditTrails []AuditSummary `json:"recent_audit_trails"`
}

type AuditSummary struct {
	EntityType   string    `json:"entity_type"`
	EntityID     uuid.UUID `json:"entity_id"`
	Action       string    `json:"action"`
	OperatorName string    `json:"operator_name"`
	CreatedAt    time.Time `json:"created_at"`
}
