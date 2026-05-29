package services

import (
	"runner-platform/internal/database"
	"runner-platform/internal/models"
	"runner-platform/internal/schemas"

	"github.com/google/uuid"
)

type LogService struct{}

func NewLogService() *LogService {
	return &LogService{}
}

func (s *LogService) QueryLogs(query *schemas.OperationLogQuery) ([]models.OperationLog, int64, error) {
	var logs []models.OperationLog
	var total int64

	db := database.DB.Model(&models.OperationLog{}).Preload("Operator")

	if query.TargetID != "" {
		targetID, _ := uuid.Parse(query.TargetID)
		db = db.Where("target_id = ?", targetID)
	}
	if query.TargetType != "" {
		db = db.Where("target_type = ?", query.TargetType)
	}
	if query.Action != "" {
		db = db.Where("action = ?", query.Action)
	}
	if query.OperatorID != "" {
		operatorID, _ := uuid.Parse(query.OperatorID)
		db = db.Where("operator_id = ?", operatorID)
	}
	if query.StartDate != "" {
		db = db.Where("created_at >= ?", query.StartDate)
	}
	if query.EndDate != "" {
		db = db.Where("created_at <= ?", query.EndDate)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.PageSize
	if err := db.Offset(offset).Limit(query.PageSize).Order("created_at DESC").Find(&logs).Error; err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

func (s *LogService) GetLogsByTarget(targetID uuid.UUID, targetType string) ([]models.OperationLog, error) {
	var logs []models.OperationLog
	if err := database.DB.Where("target_id = ? AND target_type = ?", targetID, targetType).
		Preload("Operator").
		Order("created_at DESC").
		Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

func (s *LogService) GetDashboardStats() (map[string]interface{}, error) {
	var pendingRefunds int64
	var pendingAppeals int64
	var pendingSubsidies int64
	var todayOperations int64

	database.DB.Model(&models.Refund{}).Where("status IN ?", []models.RefundStatus{
		models.RefundStatusPending, models.RefundStatusReviewing,
	}).Count(&pendingRefunds)

	database.DB.Model(&models.Appeal{}).Where("status IN ?", []models.AppealStatus{
		models.AppealStatusPending, models.AppealStatusReviewing,
	}).Count(&pendingAppeals)

	database.DB.Model(&models.Subsidy{}).Where("status = ?", models.SubsidyStatusPending).Count(&pendingSubsidies)

	today := "now()"
	database.DB.Model(&models.OperationLog{}).Where("created_at >= CURRENT_DATE").Count(&todayOperations)

	stats := map[string]interface{}{
		"pending_refunds":   pendingRefunds,
		"pending_appeals":   pendingAppeals,
		"pending_subsidies": pendingSubsidies,
		"today_operations":  todayOperations,
		"_today":            today,
	}

	return stats, nil
}
