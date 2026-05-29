package utils

import (
	"encoding/json"
	"reflect"
	"runner-platform/internal/database"
	"runner-platform/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ChangeRecord struct {
	Field string      `json:"field"`
	Old   interface{} `json:"old"`
	New   interface{} `json:"new"`
}

func LogOperation(
	c *fiber.Ctx,
	action models.OperationAction,
	targetID uuid.UUID,
	targetType string,
	oldValue interface{},
	newValue interface{},
	remark string,
) error {
	claims := GetCurrentUser(c)
	if claims == nil {
		return nil
	}

	oldJSON, _ := json.Marshal(oldValue)
	newJSON, _ := json.Marshal(newValue)

	changedFields := detectChangedFields(oldValue, newValue)

	log := &models.OperationLog{
		Action:        action,
		TargetID:      targetID,
		TargetType:    targetType,
		OperatorID:    claims.UserID,
		OperatorName:  claims.RealName,
		OperatorRole:  claims.Role,
		OldValue:      string(oldJSON),
		NewValue:      string(newJSON),
		ChangedFields: changedFields,
		IPAddress:     c.IP(),
		UserAgent:     c.Get("User-Agent"),
		Remark:        remark,
	}

	return database.DB.Create(log).Error
}

func detectChangedFields(oldVal, newVal interface{}) []string {
	if oldVal == nil || newVal == nil {
		return nil
	}

	oldReflect := reflect.Indirect(reflect.ValueOf(oldVal))
	newReflect := reflect.Indirect(reflect.ValueOf(newVal))

	if oldReflect.Kind() != reflect.Struct || newReflect.Kind() != reflect.Struct {
		return nil
	}

	if oldReflect.Type() != newReflect.Type() {
		return nil
	}

	var changed []string
	typ := oldReflect.Type()

	for i := 0; i < oldReflect.NumField(); i++ {
		field := typ.Field(i)
		if field.Anonymous {
			continue
		}

		oldField := oldReflect.Field(i)
		newField := newReflect.Field(i)

		if !oldField.CanInterface() || !newField.CanInterface() {
			continue
		}

		if !reflect.DeepEqual(oldField.Interface(), newField.Interface()) {
			changed = append(changed, field.Name)
		}
	}

	return changed
}

func GetCurrentUser(c *fiber.Ctx) *Claims {
	user, ok := c.Locals("user").(*Claims)
	if !ok {
		return nil
	}
	return user
}

func LogOperationBackground(
	action models.OperationAction,
	targetID uuid.UUID,
	targetType string,
	operatorID uuid.UUID,
	operatorName string,
	operatorRole models.Role,
	oldValue interface{},
	newValue interface{},
	remark string,
) error {
	oldJSON, _ := json.Marshal(oldValue)
	newJSON, _ := json.Marshal(newValue)
	changedFields := detectChangedFields(oldValue, newValue)

	log := &models.OperationLog{
		Action:        action,
		TargetID:      targetID,
		TargetType:    targetType,
		OperatorID:    operatorID,
		OperatorName:  operatorName,
		OperatorRole:  operatorRole,
		OldValue:      string(oldJSON),
		NewValue:      string(newJSON),
		ChangedFields: changedFields,
		IPAddress:     "127.0.0.1",
		UserAgent:     "BackgroundWorker/1.0",
		Remark:        remark,
	}

	return database.DB.Create(log).Error
}
