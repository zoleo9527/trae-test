package repository

import (
	"camp-management/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RoomRepository struct {
	baseRepository
}

func NewRoomRepository(db *gorm.DB) *RoomRepository {
	return &RoomRepository{baseRepository{db: db}}
}

func (r *RoomRepository) Create(room *model.Room) error {
	return r.db.Create(room).Error
}

func (r *RoomRepository) GetByID(id uuid.UUID) (*model.Room, error) {
	var room model.Room
	if err := r.db.Preload("Campers").First(&room, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &room, nil
}

func (r *RoomRepository) GetByCampID(campID uuid.UUID) ([]model.Room, error) {
	var rooms []model.Room
	err := r.db.Preload("Campers").Where("camp_id = ?", campID).Find(&rooms).Error
	return rooms, err
}

func (r *RoomRepository) GetAvailableRooms(campID uuid.UUID, gender model.RoomGender) ([]model.Room, error) {
	var rooms []model.Room
	err := r.db.Where("camp_id = ? AND (gender = ? OR gender = ?) AND occupied_beds < bed_count",
		campID, gender, model.RoomGenderMixed).
		Order("floor, room_number").
		Find(&rooms).Error
	return rooms, err
}

func (r *RoomRepository) Update(room *model.Room) error {
	return r.db.Save(room).Error
}

func (r *RoomRepository) BatchCreate(rooms []model.Room) error {
	return r.db.Create(&rooms).Error
}

func (r *RoomRepository) GetStatsByCampID(campID uuid.UUID) (totalRooms, totalBeds, occupiedBeds int, err error) {
	var rooms []model.Room
	if err = r.db.Where("camp_id = ?", campID).Find(&rooms).Error; err != nil {
		return
	}
	totalRooms = len(rooms)
	for _, room := range rooms {
		totalBeds += room.BedCount
		occupiedBeds += room.OccupiedBeds
	}
	return
}
