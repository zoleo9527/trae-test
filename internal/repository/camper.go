package repository

import (
	"camp-management/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

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

func (r *CamperRepository) AssignRoom(camperID uuid.UUID, roomID uuid.UUID, bedNumber int) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
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

func (r *CamperRepository) BatchAssignRoom(camperIDs []uuid.UUID, roomID uuid.UUID) (int, error) {
	var assignedCount int
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var room model.Room
		if err := tx.First(&room, "id = ?", roomID).Error; err != nil {
			return err
		}

		availableBeds := room.BedCount - room.OccupiedBeds
		if len(camperIDs) > availableBeds {
			camperIDs = camperIDs[:availableBeds]
		}

		currentBed := room.OccupiedBeds
		assignedCount = 0

		for _, camperID := range camperIDs {
			result := tx.Model(&model.Camper{}).
				Where("id = ? AND room_id IS NULL", camperID).
				Updates(map[string]interface{}{
					"room_id":    roomID,
					"bed_number": currentBed + assignedCount + 1,
				})
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected > 0 {
				assignedCount++
			}
		}

		if assignedCount > 0 {
			result := tx.Model(&model.Room{}).
				Where("id = ?", roomID).
				UpdateColumn("occupied_beds", gorm.Expr("occupied_beds + ?", assignedCount))
			if result.Error != nil {
				return result.Error
			}
		}

		return nil
	})
	return assignedCount, err
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
