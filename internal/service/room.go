package service

import (
	"camp-management/internal/model"
	"camp-management/internal/repository"
	"errors"

	"github.com/google/uuid"
)

type RoomService struct {
	repo         *repository.RoomRepository
	camperRepo   *repository.CamperRepository
	auditService *AuditService
}

func NewRoomService(repo *repository.RoomRepository, camperRepo *repository.CamperRepository, auditService *AuditService) *RoomService {
	return &RoomService{repo: repo, camperRepo: camperRepo, auditService: auditService}
}

type CreateRoomRequest struct {
	CampID     uuid.UUID         `json:"camp_id" validate:"required"`
	RoomNumber string            `json:"room_number" validate:"required"`
	Floor      int               `json:"floor" validate:"min=1"`
	Type       model.RoomType    `json:"type" validate:"required"`
	Gender     model.RoomGender  `json:"gender" validate:"required"`
	BedCount   int               `json:"bed_count" validate:"required,min=1"`
	Notes      string            `json:"notes"`
}

func (s *RoomService) Create(req CreateRoomRequest, userID uuid.UUID) (*model.Room, error) {
	room := &model.Room{
		CampID:     req.CampID,
		RoomNumber: req.RoomNumber,
		Floor:      req.Floor,
		Type:       req.Type,
		Gender:     req.Gender,
		BedCount:   req.BedCount,
		Notes:      req.Notes,
	}

	if err := s.repo.Create(room); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionCreate, "room", &room.ID, nil, room, nil, "", "", "创建房间")
	return room, nil
}

func (s *RoomService) GetByID(id uuid.UUID) (*model.Room, error) {
	room, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrRecordNotFound) {
			return nil, NewServiceError("ROOM_NOT_FOUND", "房间不存在", ErrNotFound)
		}
		return nil, err
	}
	return room, nil
}

func (s *RoomService) GetByCampID(campID uuid.UUID) ([]model.Room, error) {
	return s.repo.GetByCampID(campID)
}

func (s *RoomService) GetAvailableRooms(campID uuid.UUID, gender string) ([]model.Room, error) {
	var roomGender model.RoomGender
	if gender == "男" {
		roomGender = model.RoomGenderMale
	} else if gender == "女" {
		roomGender = model.RoomGenderFemale
	} else {
		roomGender = model.RoomGenderMixed
	}
	return s.repo.GetAvailableRooms(campID, roomGender)
}

func (s *RoomService) GetStats(campID uuid.UUID) (map[string]interface{}, error) {
	totalRooms, totalBeds, occupiedBeds, err := s.repo.GetStatsByCampID(campID)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"total_rooms":    totalRooms,
		"total_beds":     totalBeds,
		"occupied_beds":  occupiedBeds,
		"available_beds": totalBeds - occupiedBeds,
		"occupancy_rate": float64(occupiedBeds) / float64(totalBeds) * 100,
	}, nil
}

func (s *RoomService) BatchCreate(rooms []CreateRoomRequest, userID uuid.UUID) ([]model.Room, error) {
	var roomModels []model.Room
	for _, r := range rooms {
		roomModels = append(roomModels, model.Room{
			CampID:     r.CampID,
			RoomNumber: r.RoomNumber,
			Floor:      r.Floor,
			Type:       r.Type,
			Gender:     r.Gender,
			BedCount:   r.BedCount,
			Notes:      r.Notes,
		})
	}

	if err := s.repo.BatchCreate(roomModels); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionCreate, "room", nil, nil, map[string]interface{}{"count": len(rooms)}, nil, "", "", "批量创建房间")
	return roomModels, nil
}
