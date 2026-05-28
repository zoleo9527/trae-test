package service

import (
	"camp-system/internal/database"
	"camp-system/internal/model"
	"errors"
	"time"

	"gorm.io/gorm"
)

type RoomService struct {
	logService *LogService
}

func NewRoomService() *RoomService {
	return &RoomService{
		logService: NewLogService(),
	}
}

type AssignRoomRequest struct {
	CamperID    string
	RoomID      string
	BedNumber   int
	AssignedBy  string
	AssignedByName string
	AssignedByRole string
	Reason      string
	Remark      string
	IP          string
	UserAgent   string
}

func (s *RoomService) AssignRoom(req AssignRoomRequest) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		var camper model.Camper
		if err := tx.Where("id = ?", req.CamperID).First(&camper).Error; err != nil {
			return err
		}

		var newRoom model.Room
		if err := tx.Where("id = ?", req.RoomID).First(&newRoom).Error; err != nil {
			return err
		}

		if req.BedNumber < 1 || req.BedNumber > newRoom.BedCount {
			return errors.New("床位号超出范围")
		}

		if camper.RoomID == req.RoomID && camper.BedNumber == req.BedNumber {
			return errors.New("营员已在该房间该床位，无需重复分配")
		}

		if newRoom.Beds != nil {
			for _, bed := range newRoom.Beds {
				if bed.Number == req.BedNumber && bed.Occupied && bed.CamperID != req.CamperID {
					return errors.New("该床位已被占用")
				}
			}
		}

		oldRoomID := camper.RoomID
		oldBedNumber := camper.BedNumber
		isSameRoom := oldRoomID == req.RoomID

		if newRoom.GetAvailableBeds() <= 0 && !isSameRoom {
			return errors.New("房间没有可用床位")
		}

		if newRoom.Beds == nil {
			newRoom.Beds = make([]model.Bed, newRoom.BedCount)
			for i := 0; i < newRoom.BedCount; i++ {
				newRoom.Beds[i] = model.Bed{Number: i + 1, Occupied: false}
			}
		}

		if oldRoomID != "" {
			if isSameRoom {
				for i, bed := range newRoom.Beds {
					if bed.Number == oldBedNumber {
						newRoom.Beds[i].Occupied = false
						newRoom.Beds[i].CamperID = ""
					}
				}
			} else {
				var oldRoom model.Room
				if err := tx.Where("id = ?", oldRoomID).First(&oldRoom).Error; err == nil {
					oldRoom.UsedBeds--
					if oldRoom.Beds == nil {
						oldRoom.Beds = make([]model.Bed, oldRoom.BedCount)
						for i := 0; i < oldRoom.BedCount; i++ {
							oldRoom.Beds[i] = model.Bed{Number: i + 1, Occupied: false}
						}
					}
					for i, bed := range oldRoom.Beds {
						if bed.Number == oldBedNumber {
							oldRoom.Beds[i].Occupied = false
							oldRoom.Beds[i].CamperID = ""
						}
					}
					oldRoom.UpdateStatus()
					if err := tx.Save(&oldRoom).Error; err != nil {
						return err
					}
				}
			}

			tx.Model(&model.RoomAssignment{}).
				Where("camper_id = ? AND room_id = ? AND bed_number = ? AND ended_at IS NULL", req.CamperID, oldRoomID, oldBedNumber).
				Update("ended_at", time.Now())
		}

		for i, bed := range newRoom.Beds {
			if bed.Number == req.BedNumber {
				newRoom.Beds[i].Occupied = true
				newRoom.Beds[i].CamperID = req.CamperID
			}
		}

		if !isSameRoom {
			newRoom.UsedBeds++
		}
		newRoom.UpdateStatus()
		if err := tx.Save(&newRoom).Error; err != nil {
			return err
		}

		camper.RoomID = req.RoomID
		camper.BedNumber = req.BedNumber
		camper.UpdatedBy = req.AssignedBy
		if err := tx.Save(&camper).Error; err != nil {
			return err
		}

		changeLog := &model.RoomChangeLog{
			CamperID:     req.CamperID,
			OldRoomID:    oldRoomID,
			NewRoomID:    req.RoomID,
			OldBedNumber: oldBedNumber,
			NewBedNumber: req.BedNumber,
			ChangedBy:    req.AssignedBy,
			ChangeTime:   time.Now(),
			Reason:       req.Reason,
			Remark:       req.Remark,
		}
		changeLog.CreatedBy = req.AssignedBy
		changeLog.UpdatedBy = req.AssignedBy
		if err := tx.Create(changeLog).Error; err != nil {
			return err
		}

		assignment := &model.RoomAssignment{
			CamperID:   req.CamperID,
			RoomID:     req.RoomID,
			BedNumber:  req.BedNumber,
			AssignedBy: req.AssignedBy,
			AssignedAt: time.Now(),
			Remark:     req.Remark,
		}
		assignment.CreatedBy = req.AssignedBy
		assignment.UpdatedBy = req.AssignedBy
		if err := tx.Create(assignment).Error; err != nil {
			return err
		}

		action := "room_move"
		if isSameRoom {
			action = "room_bed_change"
		} else if oldRoomID == "" {
			action = "room_assign"
		}

		s.logService.LogOperation(
			req.AssignedBy, req.AssignedByName, req.AssignedByRole,
			action, "camper", req.CamperID,
			map[string]interface{}{"room_id": oldRoomID, "bed_number": oldBedNumber},
			map[string]interface{}{"room_id": req.RoomID, "bed_number": req.BedNumber},
			req.IP, req.UserAgent,
		)

		return nil
	})
}

func (s *RoomService) GetCampRooms(campID string) ([]model.Room, error) {
	var rooms []model.Room
	err := database.DB.Where("camp_id = ?", campID).
		Preload("Campers").
		Preload("Teacher").
		Order("building, floor, room_number").
		Find(&rooms).Error
	return rooms, err
}

func (s *RoomService) GetRoomStatistics(campID string) (map[string]interface{}, error) {
	var totalRooms int64
	var available, partial, full, maintenance int64

	database.DB.Model(&model.Room{}).Where("camp_id = ?", campID).Count(&totalRooms)
	database.DB.Model(&model.Room{}).Where("camp_id = ? AND status = ?", campID, model.RoomStatusAvailable).Count(&available)
	database.DB.Model(&model.Room{}).Where("camp_id = ? AND status = ?", campID, model.RoomStatusPartial).Count(&partial)
	database.DB.Model(&model.Room{}).Where("camp_id = ? AND status = ?", campID, model.RoomStatusFull).Count(&full)
	database.DB.Model(&model.Room{}).Where("camp_id = ? AND status = ?", campID, model.RoomStatusMaintenance).Count(&maintenance)

	var totalBeds, usedBeds int64
	rows, _ := database.DB.Model(&model.Room{}).Where("camp_id = ?", campID).Select("SUM(bed_count), SUM(used_beds)").Rows()
	if rows.Next() {
		rows.Scan(&totalBeds, &usedBeds)
	}
	rows.Close()

	return map[string]interface{}{
		"total_rooms":  totalRooms,
		"available":    available,
		"partial":      partial,
		"full":         full,
		"maintenance":  maintenance,
		"total_beds":   totalBeds,
		"used_beds":    usedBeds,
		"occupancy_rate": func() float64 {
			if totalBeds == 0 {
				return 0
			}
			return float64(usedBeds) / float64(totalBeds) * 100
		}(),
	}, nil
}

func (s *RoomService) ValidateCamperAccess(camperID string, userID string, userRole model.Role) error {
	var camper model.Camper
	if err := database.DB.Where("id = ?", camperID).First(&camper).Error; err != nil {
		return errors.New("营员不存在: " + camperID)
	}

	if userRole == model.RoleTeacher && camper.TeacherID != userID {
		return errors.New("无权限处理非本班营员: " + camper.Name)
	}
	return nil
}

func (s *RoomService) GetCamperRoomChanges(camperID string) ([]model.RoomChangeLog, error) {
	var logs []model.RoomChangeLog
	err := database.DB.Where("camper_id = ?", camperID).
		Preload("OldRoom").
		Preload("NewRoom").
		Preload("Operator").
		Order("change_time DESC").
		Find(&logs).Error
	return logs, err
}
