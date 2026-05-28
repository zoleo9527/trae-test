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

		var room model.Room
		if err := tx.Where("id = ?", req.RoomID).First(&room).Error; err != nil {
			return err
		}

		if room.GetAvailableBeds() <= 0 {
			return errors.New("房间没有可用床位")
		}

		oldRoomID := camper.RoomID
		oldBedNumber := camper.BedNumber

		if oldRoomID != "" {
			var oldRoom model.Room
			if err := tx.Where("id = ?", oldRoomID).First(&oldRoom).Error; err == nil {
				oldRoom.UsedBeds--
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
		}

		camper.RoomID = req.RoomID
		camper.BedNumber = req.BedNumber
		camper.UpdatedBy = req.AssignedBy
		if err := tx.Save(&camper).Error; err != nil {
			return err
		}

		room.UsedBeds++
		if room.Beds == nil {
			room.Beds = make([]model.Bed, room.BedCount)
			for i := 0; i < room.BedCount; i++ {
				room.Beds[i] = model.Bed{Number: i + 1, Occupied: false}
			}
		}
		for i, bed := range room.Beds {
			if bed.Number == req.BedNumber {
				room.Beds[i].Occupied = true
				room.Beds[i].CamperID = req.CamperID
			}
		}
		room.UpdateStatus()
		if err := tx.Save(&room).Error; err != nil {
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

		s.logService.LogOperation(
			req.AssignedBy, req.AssignedByName, req.AssignedByRole,
			"room_assign", "camper", req.CamperID,
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
