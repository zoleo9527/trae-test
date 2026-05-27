package models

import "fmt"

var (
	validScheduleTransitions = map[ScheduleStatus][]ScheduleStatus{
		ScheduleStatusPending:     {ScheduleStatusConfirmed, ScheduleStatusCancelled},
		ScheduleStatusConfirmed:   {ScheduleStatusRescheduled, ScheduleStatusCompleted, ScheduleStatusCancelled},
		ScheduleStatusRescheduled: {ScheduleStatusConfirmed, ScheduleStatusCancelled},
		ScheduleStatusCompleted:   {},
		ScheduleStatusCancelled:   {},
	}

	validDispatchTransitions = map[DispatchStatus][]DispatchStatus{
		DispatchStatusPending:     {DispatchStatusConfirmed, DispatchStatusCancelled},
		DispatchStatusConfirmed:   {DispatchStatusPickedUp, DispatchStatusCancelled, DispatchStatusRescheduled},
		DispatchStatusRescheduled: {DispatchStatusConfirmed, DispatchStatusCancelled},
		DispatchStatusPickedUp:    {DispatchStatusReturned},
		DispatchStatusReturned:    {},
		DispatchStatusCancelled:   {},
	}

	validMaintenanceTransitions = map[MaintenanceStatus][]MaintenanceStatus{
		MaintenanceStatusPending: {MaintenanceStatusDoing, MaintenanceStatusDone},
		MaintenanceStatusDoing:   {MaintenanceStatusDone},
		MaintenanceStatusDone:    {},
	}
)

func HasUnreturnedDispatches(dispatches []CostumeDispatch) bool {
	for _, d := range dispatches {
		if d.Status == DispatchStatusPickedUp {
			return true
		}
	}
	return false
}

func GetUnreturnedDispatchIDs(dispatches []CostumeDispatch) []uint {
	var ids []uint
	for _, d := range dispatches {
		if d.Status == DispatchStatusPickedUp {
			ids = append(ids, d.ID)
		}
	}
	return ids
}

func GetDispatchStatusText(status DispatchStatus) string {
	switch status {
	case DispatchStatusPending:
		return "待确认"
	case DispatchStatusConfirmed:
		return "已确认"
	case DispatchStatusRescheduled:
		return "已改期"
	case DispatchStatusPickedUp:
		return "已取件"
	case DispatchStatusReturned:
		return "已归还"
	case DispatchStatusCancelled:
		return "已取消"
	default:
		return string(status)
	}
}

func GetScheduleStatusText(status ScheduleStatus) string {
	switch status {
	case ScheduleStatusPending:
		return "待确认"
	case ScheduleStatusConfirmed:
		return "已确认"
	case ScheduleStatusRescheduled:
		return "已改期"
	case ScheduleStatusCompleted:
		return "已完成"
	case ScheduleStatusCancelled:
		return "已取消"
	default:
		return string(status)
	}
}

func CanCancelSchedule(dispatches []CostumeDispatch) (bool, string) {
	for _, d := range dispatches {
		if d.Status == DispatchStatusPickedUp {
			return false, fmt.Sprintf("存在已取件未归还的调度记录(ID:%d)，请先完成归还后再取消", d.ID)
		}
	}
	return true, ""
}

func CanRescheduleSchedule(dispatches []CostumeDispatch) (bool, string) {
	for _, d := range dispatches {
		if d.Status == DispatchStatusPickedUp {
			return false, fmt.Sprintf("存在已取件未归还的调度记录(ID:%d)，请先完成归还后再改期", d.ID)
		}
	}
	return true, ""
}

func CanCompleteSchedule(dispatches []CostumeDispatch) (bool, string) {
	for _, d := range dispatches {
		if d.Status == DispatchStatusPickedUp {
			return false, fmt.Sprintf("存在已取件未归还的调度记录(ID:%d)，请先完成归还后再完成", d.ID)
		}
	}
	return true, ""
}

func IsValidScheduleStatus(status string) bool {
	switch ScheduleStatus(status) {
	case ScheduleStatusPending, ScheduleStatusConfirmed, ScheduleStatusRescheduled,
		ScheduleStatusCompleted, ScheduleStatusCancelled:
		return true
	default:
		return false
	}
}

func IsValidDispatchStatus(status string) bool {
	switch DispatchStatus(status) {
	case DispatchStatusPending, DispatchStatusConfirmed, DispatchStatusRescheduled,
		DispatchStatusPickedUp, DispatchStatusReturned, DispatchStatusCancelled:
		return true
	default:
		return false
	}
}

func IsValidMaintenanceStatus(status string) bool {
	switch MaintenanceStatus(status) {
	case MaintenanceStatusPending, MaintenanceStatusDoing, MaintenanceStatusDone:
		return true
	default:
		return false
	}
}

func CanTransitionSchedule(from, to ScheduleStatus) bool {
	validTos, ok := validScheduleTransitions[from]
	if !ok {
		return false
	}
	for _, validTo := range validTos {
		if validTo == to {
			return true
		}
	}
	return false
}

func CanTransitionDispatch(from, to DispatchStatus) bool {
	validTos, ok := validDispatchTransitions[from]
	if !ok {
		return false
	}
	for _, validTo := range validTos {
		if validTo == to {
			return true
		}
	}
	return false
}

func CanTransitionMaintenance(from, to MaintenanceStatus) bool {
	validTos, ok := validMaintenanceTransitions[from]
	if !ok {
		return false
	}
	for _, validTo := range validTos {
		if validTo == to {
			return true
		}
	}
	return false
}

func ValidateScheduleTransition(from, to ScheduleStatus) error {
	if !IsValidScheduleStatus(string(to)) {
		return fmt.Errorf("无效的档期状态: %s", to)
	}
	if !CanTransitionSchedule(from, to) {
		return fmt.Errorf("状态流转不合法: %s -> %s", from, to)
	}
	return nil
}

func ValidateDispatchTransition(from, to DispatchStatus) error {
	if !IsValidDispatchStatus(string(to)) {
		return fmt.Errorf("无效的调度状态: %s", to)
	}
	if !CanTransitionDispatch(from, to) {
		return fmt.Errorf("状态流转不合法: %s -> %s", from, to)
	}
	return nil
}

func ValidateMaintenanceTransition(from, to MaintenanceStatus) error {
	if !IsValidMaintenanceStatus(string(to)) {
		return fmt.Errorf("无效的保养状态: %s", to)
	}
	if !CanTransitionMaintenance(from, to) {
		return fmt.Errorf("状态流转不合法: %s -> %s", from, to)
	}
	return nil
}
