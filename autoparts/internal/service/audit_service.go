package service

import (
	"encoding/json"
	"fmt"

	"autoparts/internal/config"
	"autoparts/internal/model"
)

type AuditService struct{}

func NewAuditService() *AuditService {
	return &AuditService{}
}

func (s *AuditService) Log(user *model.User, action model.AuditAction, module string, recordID uint, recordNo string, fieldName string, oldValue, newValue interface{}, ip, remark string) error {
	oldValStr := s.toString(oldValue)
	newValStr := s.toString(newValue)

	log := &model.AuditLog{
		UserID:    user.ID,
		UserName:  user.Name,
		Action:    action,
		Module:    module,
		RecordID:  recordID,
		RecordNo:  recordNo,
		FieldName: fieldName,
		OldValue:  oldValStr,
		NewValue:  newValStr,
		IPAddress: ip,
		Remark:    remark,
	}

	return config.DB.Create(log).Error
}

func (s *AuditService) LogCreate(user *model.User, module string, recordID uint, recordNo string, newValue interface{}, ip string) error {
	return s.Log(user, model.AuditActionCreate, module, recordID, recordNo, "", nil, newValue, ip, "创建记录")
}

func (s *AuditService) LogUpdate(user *model.User, module string, recordID uint, recordNo string, fieldName string, oldValue, newValue interface{}, ip string) error {
	return s.Log(user, model.AuditActionUpdate, module, recordID, recordNo, fieldName, oldValue, newValue, ip, fmt.Sprintf("更新字段: %s", fieldName))
}

func (s *AuditService) LogStatusChange(user *model.User, module string, recordID uint, recordNo string, oldStatus, newStatus string, ip string) error {
	return s.Log(user, model.AuditActionStatus, module, recordID, recordNo, "status", oldStatus, newStatus, ip, fmt.Sprintf("状态变更: %s -> %s", oldStatus, newStatus))
}

func (s *AuditService) LogDelete(user *model.User, module string, recordID uint, recordNo string, ip string) error {
	return s.Log(user, model.AuditActionDelete, module, recordID, recordNo, "", nil, nil, ip, "删除记录")
}

func (s *AuditService) toString(v interface{}) string {
	if v == nil {
		return ""
	}
	switch val := v.(type) {
	case string:
		return val
	case fmt.Stringer:
		return val.String()
	default:
		bytes, err := json.Marshal(v)
		if err != nil {
			return fmt.Sprintf("%v", v)
		}
		return string(bytes)
	}
}

func (s *AuditService) GetLogs(filter *model.AuditLog, page, pageSize int) ([]model.AuditLog, int64, error) {
	var logs []model.AuditLog
	var total int64

	query := config.DB.Model(&model.AuditLog{})

	if filter.Module != "" {
		query = query.Where("module = ?", filter.Module)
	}
	if filter.Action != "" {
		query = query.Where("action = ?", filter.Action)
	}
	if filter.UserID > 0 {
		query = query.Where("user_id = ?", filter.UserID)
	}
	if filter.RecordID > 0 {
		query = query.Where("record_id = ?", filter.RecordID)
	}
	if filter.RecordNo != "" {
		query = query.Where("record_no LIKE ?", "%"+filter.RecordNo+"%")
	}

	query.Count(&total)

	err := query.Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&logs).Error

	return logs, total, err
}
