package middleware

import (
	"encoding/json"
	"instrument-rental/database"
	"instrument-rental/model"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func AuditLog() fiber.Handler {
	return func(c *fiber.Ctx) error {
		err := c.Next()
		if c.Method() == "GET" {
			return err
		}
		userIDVal := c.Locals("user_id")
		if userIDVal == nil {
			return err
		}
		userID := userIDVal.(uint)
		action := c.Method()
		path := c.OriginalURL()
		entityType, entityID := parseEntityFromPath(path)
		if entityType == "" {
			return err
		}
		entry := model.AuditLog{
			UserID:     userID,
			Action:     action,
			EntityType: entityType,
			EntityID:   entityID,
			IPAddress:  c.IP(),
		}
		body := c.Body()
		if len(body) > 0 {
			var newVal model.JSONMap
			if json.Unmarshal(body, &newVal) == nil {
				entry.NewValue = newVal
			}
		}
		database.DB.Create(&entry)
		return err
	}
}

func LogChange(userID uint, action, entityType string, entityID uint, oldVal, newVal model.JSONMap, ip string) {
	entry := model.AuditLog{
		UserID:     userID,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		OldValue:   oldVal,
		NewValue:   newVal,
		IPAddress:  ip,
	}
	database.DB.Create(&entry)
}

func FetchOldValues(entityType string, entityID uint) model.JSONMap {
	var result model.JSONMap
	switch entityType {
	case "rental":
		var r model.Rental
		if database.DB.First(&r, entityID).Error == nil {
			bytes, _ := json.Marshal(r)
			json.Unmarshal(bytes, &result)
		}
	case "payment":
		var p model.Payment
		if database.DB.First(&p, entityID).Error == nil {
			bytes, _ := json.Marshal(p)
			json.Unmarshal(bytes, &result)
		}
	case "school":
		var s model.School
		if database.DB.First(&s, entityID).Error == nil {
			bytes, _ := json.Marshal(s)
			json.Unmarshal(bytes, &result)
		}
	case "return_record":
		var r model.ReturnRecord
		if database.DB.First(&r, entityID).Error == nil {
			bytes, _ := json.Marshal(r)
			json.Unmarshal(bytes, &result)
		}
	case "maintenance":
		var m model.Maintenance
		if database.DB.First(&m, entityID).Error == nil {
			bytes, _ := json.Marshal(m)
			json.Unmarshal(bytes, &result)
		}
	case "instrument":
		var i model.Instrument
		if database.DB.First(&i, entityID).Error == nil {
			bytes, _ := json.Marshal(i)
			json.Unmarshal(bytes, &result)
		}
	}
	return result
}

func parseEntityFromPath(path string) (string, uint) {
	segments := splitPath(path)
	if len(segments) < 2 {
		return "", 0
	}
	apiIdx := -1
	for i, s := range segments {
		if s == "api" {
			apiIdx = i
			break
		}
	}
	if apiIdx < 0 || apiIdx+1 >= len(segments) {
		return "", 0
	}
	entityType := segments[apiIdx+1]
	if entityType == "auth" || entityType == "dashboard" || entityType == "batch" {
		return "", 0
	}
	if len(segments) > apiIdx+2 {
		id, err := strconv.ParseUint(segments[apiIdx+2], 10, 32)
		if err == nil {
			return entityType, uint(id)
		}
	}
	return entityType, 0
}

func splitPath(path string) []string {
	var result []string
	for _, s := range split(path, '/') {
		if s != "" {
			result = append(result, s)
		}
	}
	return result
}

func split(s string, sep byte) []string {
	var result []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == sep {
			result = append(result, s[start:i])
			start = i + 1
		}
	}
	result = append(result, s[start:])
	return result
}

func GetAuditLogs(entityType string, entityID uint, userID uint, page, pageSize int) ([]model.AuditLog, int64, error) {
	var logs []model.AuditLog
	var total int64
	q := database.DB.Model(&model.AuditLog{})
	if entityType != "" {
		q = q.Where("entity_type = ?", entityType)
	}
	if entityID > 0 {
		q = q.Where("entity_id = ?", entityID)
	}
	if userID > 0 {
		q = q.Where("user_id = ?", userID)
	}
	q.Count(&total)
	offset := (page - 1) * pageSize
	err := q.Preload("User").Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&logs).Error
	return logs, total, err
}

var _ = gorm.Model{}
