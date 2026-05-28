package service

import (
	"camp-management/internal/async"
	"camp-management/internal/model"
	"camp-management/internal/repository"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type CamperService struct {
	repo         *repository.CamperRepository
	campRepo     *repository.CampRepository
	roomRepo     *repository.RoomRepository
	auditService *AuditService
	taskQueue    *async.TaskQueue
}

func NewCamperService(repo *repository.CamperRepository, campRepo *repository.CampRepository, roomRepo *repository.RoomRepository, auditService *AuditService, taskQueue *async.TaskQueue) *CamperService {
	service := &CamperService{
		repo:         repo,
		campRepo:     campRepo,
		roomRepo:     roomRepo,
		auditService: auditService,
		taskQueue:    taskQueue,
	}
	service.registerTaskHandlers()
	return service
}

func (s *CamperService) registerTaskHandlers() {
	s.taskQueue.RegisterHandler(async.TaskTypeBatchAssignRooms, s.handleBatchAssignRoomsTask)
}

type CreateCamperRequest struct {
	CampID         uuid.UUID `json:"camp_id" validate:"required"`
	Name           string    `json:"name" validate:"required"`
	Gender         string    `json:"gender" validate:"required"`
	BirthDate      string    `json:"birth_date" validate:"required"`
	Age            int       `json:"age" validate:"required,min=5,max=18"`
	IDCard         string    `json:"id_card"`
	HealthNotes    string    `json:"health_notes"`
	DietaryNeeds   string    `json:"dietary_needs"`
	EmergencyName  string    `json:"emergency_name" validate:"required"`
	EmergencyPhone string    `json:"emergency_phone" validate:"required"`
	Relationship   string    `json:"relationship" validate:"required"`
}

func (s *CamperService) Create(req CreateCamperRequest, userID uuid.UUID) (*model.Camper, error) {
	camp, err := s.campRepo.GetByID(req.CampID)
	if err != nil {
		return nil, NewServiceError("CAMP_NOT_FOUND", "营地不存在", ErrNotFound)
	}

	if camp.IsFull() {
		return nil, NewServiceError("CAMP_FULL", "营地已满员", ErrCapacity)
	}

	birthDate, err := time.Parse("2006-01-02", req.BirthDate)
	if err != nil {
		return nil, NewServiceError("INVALID_BIRTH_DATE", "出生日期格式错误", ErrValidation)
	}

	camper := &model.Camper{
		CampID:         req.CampID,
		Name:           req.Name,
		Gender:         req.Gender,
		BirthDate:      birthDate,
		Age:            req.Age,
		IDCard:         req.IDCard,
		HealthNotes:    req.HealthNotes,
		DietaryNeeds:   req.DietaryNeeds,
		EmergencyName:  req.EmergencyName,
		EmergencyPhone: req.EmergencyPhone,
		Relationship:   req.Relationship,
		Status:         model.CamperStatusPending,
		CreatedBy:      userID,
	}

	if err := s.repo.Create(camper); err != nil {
		return nil, err
	}

	s.campRepo.IncrementCamperCount(req.CampID)

	s.auditService.Log(userID, model.AuditActionCreate, "camper", &camper.ID, nil, camper, nil, "", "", "创建营员")
	return camper, nil
}

type BatchCreateCamperRequest struct {
	CampID  uuid.UUID             `json:"camp_id" validate:"required"`
	Campers []CreateCamperRequest `json:"campers" validate:"required,min=1"`
}

func (s *CamperService) BatchCreate(req BatchCreateCamperRequest, userID uuid.UUID) ([]model.Camper, error) {
	camp, err := s.campRepo.GetByID(req.CampID)
	if err != nil {
		return nil, NewServiceError("CAMP_NOT_FOUND", "营地不存在", ErrNotFound)
	}

	remaining := camp.MaxCampers - camp.CurrentCampers
	if len(req.Campers) > remaining {
		return nil, NewServiceError("CAMP_CAPACITY_EXCEEDED", fmt.Sprintf("营地容量不足，剩余空位：%d", remaining), ErrCapacity)
	}

	var campers []model.Camper
	for _, c := range req.Campers {
		birthDate, _ := time.Parse("2006-01-02", c.BirthDate)
		camper := model.Camper{
			CampID:         req.CampID,
			Name:           c.Name,
			Gender:         c.Gender,
			BirthDate:      birthDate,
			Age:            c.Age,
			IDCard:         c.IDCard,
			HealthNotes:    c.HealthNotes,
			DietaryNeeds:   c.DietaryNeeds,
			EmergencyName:  c.EmergencyName,
			EmergencyPhone: c.EmergencyPhone,
			Relationship:   c.Relationship,
			Status:         model.CamperStatusPending,
			CreatedBy:      userID,
		}
		campers = append(campers, camper)
	}

	if err := s.repo.BatchCreate(campers); err != nil {
		return nil, err
	}

	s.campRepo.UpdateCurrentCampers(req.CampID, len(campers))

	s.auditService.Log(userID, model.AuditActionCreate, "camper", nil, nil, map[string]interface{}{"count": len(campers)}, nil, "", "", "批量创建营员")
	return campers, nil
}

func (s *CamperService) GetByID(id uuid.UUID) (*model.Camper, error) {
	camper, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrRecordNotFound) {
			return nil, NewServiceError("CAMPER_NOT_FOUND", "营员不存在", ErrNotFound)
		}
		return nil, err
	}
	return camper, nil
}

func (s *CamperService) Search(campID uuid.UUID, keyword string, status *model.CamperStatus, page, pageSize int) ([]model.Camper, int64, error) {
	offset := (page - 1) * pageSize
	return s.repo.Search(campID, keyword, status, offset, pageSize)
}

type AssignRoomRequest struct {
	CamperID uuid.UUID `json:"camper_id" validate:"required"`
	RoomID   uuid.UUID `json:"room_id" validate:"required"`
}

func (s *CamperService) AssignRoom(req AssignRoomRequest, userID uuid.UUID) error {
	camper, err := s.GetByID(req.CamperID)
	if err != nil {
		return err
	}

	if !camper.CanAssignRoom() {
		return NewServiceError("INVALID_CAMPER_STATUS", "营员状态不允许分配房间", ErrConflict)
	}

	if camper.RoomID != nil {
		return NewServiceError("ALREADY_ASSIGNED", "营员已分配房间", ErrConflict)
	}

	room, err := s.roomRepo.GetByID(req.RoomID)
	if err != nil {
		return NewServiceError("ROOM_NOT_FOUND", "房间不存在", ErrNotFound)
	}

	if room.IsFull() {
		return NewServiceError("ROOM_FULL", "房间已满", ErrCapacity)
	}

	if room.Gender != model.RoomGenderMixed {
		if (camper.Gender == "男" && room.Gender != model.RoomGenderMale) ||
			(camper.Gender == "女" && room.Gender != model.RoomGenderFemale) {
			return NewServiceError("GENDER_MISMATCH", "房间性别不匹配", ErrConflict)
		}
	}

	bedNumber := room.OccupiedBeds + 1
	if err := s.repo.AssignRoom(req.CamperID, req.RoomID, bedNumber); err != nil {
		if errors.Is(err, repository.ErrInvalidStatus) {
			return NewServiceError("ALREADY_ASSIGNED", "营员已分配房间", ErrConflict)
		}
		return err
	}

	s.auditService.Log(userID, model.AuditActionAssign, "camper", &req.CamperID,
		map[string]interface{}{"room_id": nil},
		map[string]interface{}{"room_id": req.RoomID, "bed_number": bedNumber},
		map[string]interface{}{"room_id": req.RoomID.String()},
		"", "", "分配房间")

	return nil
}

type BatchAssignRoomRequest struct {
	CamperIDs []uuid.UUID `json:"camper_ids" validate:"required,min=1"`
	RoomID    uuid.UUID   `json:"room_id" validate:"required"`
}

func (s *CamperService) BatchAssignRoomAsync(req BatchAssignRoomRequest, userID uuid.UUID) (*async.Task, error) {
	room, err := s.roomRepo.GetByID(req.RoomID)
	if err != nil {
		return nil, NewServiceError("ROOM_NOT_FOUND", "房间不存在", ErrNotFound)
	}

	available := room.BedCount - room.OccupiedBeds
	if len(req.CamperIDs) > available {
		return nil, NewServiceError("ROOM_CAPACITY_EXCEEDED", fmt.Sprintf("房间容量不足，剩余空位：%d", available), ErrCapacity)
	}

	return s.taskQueue.Submit(async.TaskTypeBatchAssignRooms, req, userID)
}

func (s *CamperService) handleBatchAssignRoomsTask(task *async.Task) error {
	var req BatchAssignRoomRequest
	if err := json.Unmarshal(task.Payload, &req); err != nil {
		return err
	}

	room, err := s.roomRepo.GetByID(req.RoomID)
	if err != nil {
		return err
	}

	var validCamperIDs []uuid.UUID
	for _, camperID := range req.CamperIDs {
		camper, err := s.repo.GetByID(camperID)
		if err != nil {
			continue
		}
		if !camper.CanAssignRoom() || camper.RoomID != nil {
			continue
		}
		if room.Gender != model.RoomGenderMixed {
			if (camper.Gender == "男" && room.Gender != model.RoomGenderMale) ||
				(camper.Gender == "女" && room.Gender != model.RoomGenderFemale) {
				continue
			}
		}
		validCamperIDs = append(validCamperIDs, camperID)
	}

	if len(validCamperIDs) == 0 {
		task.Result = "没有符合条件的营员"
		return nil
	}

	if err := s.repo.BatchAssignRoom(validCamperIDs, req.RoomID); err != nil {
		return err
	}

	task.Result = fmt.Sprintf("成功分配 %d 名营员", len(validCamperIDs))
	return nil
}

func (s *CamperService) UnassignRoom(camperID uuid.UUID, userID uuid.UUID) error {
	camper, err := s.GetByID(camperID)
	if err != nil {
		return err
	}

	if camper.RoomID == nil {
		return NewServiceError("NOT_ASSIGNED", "营员未分配房间", ErrConflict)
	}

	roomID := *camper.RoomID
	if err := s.repo.UnassignRoom(camperID, roomID); err != nil {
		return err
	}

	s.auditService.Log(userID, model.AuditActionUpdate, "camper", &camperID,
		map[string]interface{}{"room_id": roomID},
		map[string]interface{}{"room_id": nil},
		map[string]interface{}{"action": "unassign_room"},
		"", "", "取消房间分配")

	return nil
}

func (s *CamperService) UpdateStatus(id uuid.UUID, status model.CamperStatus, userID uuid.UUID) (*model.Camper, error) {
	camper, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if status == model.CamperStatusCheckedIn && camper.RoomID == nil {
		return nil, NewServiceError("ROOM_NOT_ASSIGNED", "入住前必须先分配房间", ErrConflict)
	}

	oldStatus := camper.Status
	camper.Status = status

	if status == model.CamperStatusCheckedIn {
		now := time.Now()
		camper.CheckInTime = &now
	} else if status == model.CamperStatusCheckedOut {
		now := time.Now()
		camper.CheckOutTime = &now
	}

	if err := s.repo.Update(camper); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionStatusChange, "camper", &camper.ID,
		map[string]interface{}{"status": oldStatus},
		map[string]interface{}{"status": status},
		map[string]interface{}{"status": string(oldStatus) + " -> " + string(status)},
		"", "", "更新营员状态")

	return camper, nil
}

func (s *CamperService) GetWithoutRoom(campID uuid.UUID) ([]model.Camper, error) {
	return s.repo.GetWithoutRoom(campID)
}
