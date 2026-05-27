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
		DispatchStatusPending:     {DispatchStatusConfirmed, DispatchStatusCancelled, DispatchStatusPickedUp},
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
