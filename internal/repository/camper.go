package repository

import (
	"camp-management/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type CamperAssignment struct {
	CamperID  uuid.UUID
	BedNumber int
}

type BatchAssignResult struct {
	RoomNumber  string
	OldOccupied int
	NewOccupied int
	Assignments []CamperAssignment
	IsRoomFull  bool
}

type CamperRepository struct {
	baseRepository
}

func NewCamperRepository(db *gorm.DB) *CamperRepository {
	return &CamperRepository{baseRepository{db: db}}
}

func (r *CamperRepository) Create(camper *model.Camper) error {
	return r.db.Create(camper).Error
}

func (r *CamperRepository) GetByID(id uuid.UUID) (*model.Camper, error) {
	var camper model.Camper
	if err := r.db.Preload("Room").First(&camper, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &camper, nil
}

func (r *CamperRepository) GetByCampID(campID uuid.UUID, opts QueryOptions) ([]model.Camper, int64, error) {
	var campers []model.Camper
	opts.Filters = append(opts.Filters, QueryFilter{Field: "camp_id", Operator: "eq", Value: campID})
	total, err := r.Query(&campers, opts)
	return campers, total, err
}

func (r *CamperRepository) GetByRoomID(roomID uuid.UUID) ([]model.Camper, error) {
	var campers []model.Camper
	err := r.db.Where("room_id = ?", roomID).Find(&campers).Error
	return campers, err
}

func (r *CamperRepository) Update(camper *model.Camper) error {
	return r.db.Save(camper).Error
}

func (r *CamperRepository) AssignRoom(camperID uuid.UUID, roomID uuid.UUID) (int, error) {
	var bedNumber int
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var room model.Room
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&room, "id = ?", roomID).Error; err != nil {
			return err
		}

		if room.OccupiedBeds >= room.BedCount {
			return ErrCapacityFull
		}

		var camper model.Camper
		if err := tx.First(&camper, "id = ? AND room_id IS NULL", camperID).Error; err != nil {
			return ErrInvalidStatus
		}

		if room.Gender != model.RoomGenderMixed {
			if (camper.Gender == "男" && room.Gender != model.RoomGenderMale) ||
				(camper.Gender == "女" && room.Gender != model.RoomGenderFemale) {
				return ErrInvalidStatus
			}
		}

		bedNumber = room.OccupiedBeds + 1

		result := tx.Model(&model.Camper{}).
			Where("id = ? AND room_id IS NULL", camperID).
			Updates(map[string]interface{}{
				"room_id":    roomID,
				"bed_number": bedNumber,
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return ErrInvalidStatus
		}

		result = tx.Model(&model.Room{}).
			Where("id = ?", roomID).
			UpdateColumn("occupied_beds", gorm.Expr("occupied_beds + 1"))
		return result.Error
	})
	return bedNumber, err
}

func (r *CamperRepository) UnassignRoom(camperID uuid.UUID, roomID uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&model.Camper{}).
			Where("id = ?", camperID).
			Updates(map[string]interface{}{
				"room_id":    nil,
				"bed_number": 0,
			})
		if result.Error != nil {
			return result.Error
		}

		result = tx.Model(&model.Room{}).
			Where("id = ?", roomID).
			UpdateColumn("occupied_beds", gorm.Expr("occupied_beds - 1"))
		return result.Error
	})
}

func (r *CamperRepository) BatchCreate(campers []model.Camper) error {
	return r.db.Create(&campers).Error
}

func (r *CamperRepository) BatchAssignRoom(camperIDs []uuid.UUID, roomID uuid.UUID) (*BatchAssignResult, error) {
	result := &BatchAssignResult{}
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var room model.Room
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&room, "id = ?", roomID).Error; err != nil {
			return err
		}

		result.RoomNumber = room.RoomNumber
		result.OldOccupied = room.OccupiedBeds

		availableBeds := room.BedCount - room.OccupiedBeds
		if availableBeds <= 0 {
			result.IsRoomFull = true
			return nil
		}

		toAssign := camperIDs
		if len(toAssign) > availableBeds {
			toAssign = toAssign[:availableBeds]
		}

		nextBed := room.OccupiedBeds + 1
		result.Assignments = make([]CamperAssignment, 0, len(toAssign))

		for _, camperID := range toAssign {
			var camper model.Camper
			if err := tx.First(&camper, "id = ? AND room_id IS NULL", camperID).Error; err != nil {
				continue
			}

			if room.Gender != model.RoomGenderMixed {
				if (camper.Gender == "男" && room.Gender != model.RoomGenderMale) ||
					(camper.Gender == "女" && room.Gender != model.RoomGenderFemale) {
					continue
				}
			}

			updateResult := tx.Model(&model.Camper{}).
				Where("id = ? AND room_id IS NULL", camperID).
				Updates(map[string]interface{}{
					"room_id":    roomID,
					"bed_number": nextBed,
				})
			if updateResult.Error != nil {
				return updateResult.Error
			}
			if updateResult.RowsAffected > 0 {
				result.Assignments = append(result.Assignments, CamperAssignment{
					CamperID:  camperID,
					BedNumber: nextBed,
				})
				nextBed++
			}
		}

		if len(result.Assignments) > 0 {
			if err := tx.Model(&model.Room{}).
				Where("id = ?", roomID).
				UpdateColumn("occupied_beds", gorm.Expr("occupied_beds + ?", len(result.Assignments))).Error; err != nil {
				return err
			}
			result.NewOccupied = result.OldOccupied + len(result.Assignments)
		}

		return nil
	})
	return result, err
}

func (r *CamperRepository) Search(campID uuid.UUID, keyword string, status *model.CamperStatus, offset, limit int) ([]model.Camper, int64, error) {
	var campers []model.Camper
	query := r.db.Model(&model.Camper{}).Where("camp_id = ?", campID)

	if keyword != "" {
		query = query.Where("name LIKE ? OR id_card LIKE ? OR emergency_name LIKE ?",
			"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	if status != nil {
		query = query.Where("status = ?", *status)
	}

	var total int64
	query.Count(&total)

	err := query.Offset(offset).Limit(limit).Preload("Room").Find(&campers).Error
	return campers, total, err
}

func (r *CamperRepository) GetWithoutRoom(campID uuid.UUID) ([]model.Camper, error) {
	var campers []model.Camper
	err := r.db.Where("camp_id = ? AND room_id IS NULL AND status IN ?",
		campID, []model.CamperStatus{model.CamperStatusRegistered, model.CamperStatusCheckedIn}).
		Find(&campers).Error
	return campers, err
}
