package service

import (
	"encoding/json"
	"fmt"
	"math"

	appErrors "watch-after-sales/backend/errors"
	"watch-after-sales/backend/dto"
	"watch-after-sales/backend/model"

	"gorm.io/gorm"
)

type PartService struct {
	db           *gorm.DB
	auditService *AuditService
}

func NewPartService(db *gorm.DB, auditService *AuditService) *PartService {
	return &PartService{db: db, auditService: auditService}
}

func (s *PartService) Create(req dto.CreatePartRequest, operatorID uint, operatorName string) (*dto.PartResponse, *appErrors.AppError) {
	part := model.Part{
		Name:        req.Name,
		Sku:         req.Sku,
		Quantity:    req.Quantity,
		MinQuantity: req.MinQuantity,
		UnitPrice:   req.UnitPrice,
	}

	if err := s.db.Create(&part).Error; err != nil {
		return nil, appErrors.NewConflictError("part with this SKU already exists")
	}

	s.auditService.Log("part", part.ID, "create", nil, toJSONMap(part), operatorID, operatorName)

	return s.toResponse(&part), nil
}

func (s *PartService) GetByID(id uint) (*dto.PartResponse, *appErrors.AppError) {
	var part model.Part
	if err := s.db.First(&part, id).Error; err != nil {
		return nil, appErrors.NewNotFoundError("part not found")
	}
	return s.toResponse(&part), nil
}

func (s *PartService) List(page, pageSize int, keyword string) (*dto.PaginatedResponse, *appErrors.AppError) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	query := s.db.Model(&model.Part{})
	if keyword != "" {
		like := "%" + keyword + "%"
		query = query.Where("name LIKE ? OR sku LIKE ?", like, like)
	}

	var total int64
	query.Count(&total)

	var parts []model.Part
	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&parts).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to query parts")
	}

	data := make([]dto.PartResponse, len(parts))
	for i := range parts {
		data[i] = *s.toResponse(&parts[i])
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))

	return &dto.PaginatedResponse{
		Data:       data,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *PartService) Update(id uint, req dto.UpdatePartRequest, operatorID uint, operatorName string) (*dto.PartResponse, *appErrors.AppError) {
	var part model.Part
	if err := s.db.First(&part, id).Error; err != nil {
		return nil, appErrors.NewNotFoundError("part not found")
	}

	oldData := toJSONMap(part)

	if req.Name != "" {
		part.Name = req.Name
	}
	if req.Quantity != nil {
		part.Quantity = *req.Quantity
	}
	if req.MinQuantity != nil {
		part.MinQuantity = *req.MinQuantity
	}
	if req.UnitPrice != nil {
		part.UnitPrice = *req.UnitPrice
	}

	if err := s.db.Save(&part).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to update part")
	}

	s.auditService.Log("part", part.ID, "update", oldData, toJSONMap(part), operatorID, operatorName)

	return s.toResponse(&part), nil
}

func (s *PartService) LockPart(repairOrderID uint, req dto.LockPartRequest, operatorID uint, operatorName string) (*dto.PartLockResponse, *appErrors.AppError) {
	var part model.Part
	if err := s.db.First(&part, req.PartID).Error; err != nil {
		return nil, appErrors.NewNotFoundError("part not found")
	}

	if part.AvailableQuantity() < req.Quantity {
		return nil, appErrors.NewConflictError(fmt.Sprintf("insufficient available quantity: available %d, requested %d", part.AvailableQuantity(), req.Quantity))
	}

	var order model.RepairOrder
	if err := s.db.First(&order, repairOrderID).Error; err != nil {
		return nil, appErrors.NewNotFoundError("repair order not found")
	}

	lock := model.PartLock{
		RepairOrderID: repairOrderID,
		PartID:        req.PartID,
		Quantity:      req.Quantity,
		LockedBy:      operatorID,
	}

	if err := s.db.Create(&lock).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to create part lock")
	}

	part.LockedQuantity += req.Quantity
	s.db.Save(&part)

	s.auditService.Log("part_lock", lock.ID, "create", nil, toJSONMap(lock), operatorID, operatorName)

	s.db.Preload("Part").Preload("LockedByUser").First(&lock, lock.ID)

	return s.toLockResponse(&lock), nil
}

func (s *PartService) UnlockPart(repairOrderID uint, lockID uint, operatorID uint, operatorName string) *appErrors.AppError {
	var lock model.PartLock
	if err := s.db.Where("id = ? AND repair_order_id = ?", lockID, repairOrderID).First(&lock).Error; err != nil {
		return appErrors.NewNotFoundError("part lock not found")
	}

	if lock.ReleasedAt != nil {
		return appErrors.NewConflictError("part lock already released")
	}

	now := gorm.Expr("NOW()")
	s.db.Model(&lock).Update("released_at", now)

	var part model.Part
	s.db.First(&part, lock.PartID)
	part.LockedQuantity -= lock.Quantity
	if part.LockedQuantity < 0 {
		part.LockedQuantity = 0
	}
	s.db.Save(&part)

	s.auditService.Log("part_lock", lock.ID, "update", toJSONMap(map[string]interface{}{"released": false}), toJSONMap(map[string]interface{}{"released": true}), operatorID, operatorName)

	return nil
}

func (s *PartService) GetLowStockParts() ([]dto.PartResponse, *appErrors.AppError) {
	var parts []model.Part
	if err := s.db.Where("quantity - locked_quantity <= min_quantity").Find(&parts).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to query low stock parts")
	}

	data := make([]dto.PartResponse, len(parts))
	for i := range parts {
		data[i] = *s.toResponse(&parts[i])
	}
	return data, nil
}

func (s *PartService) toResponse(part *model.Part) *dto.PartResponse {
	available := part.AvailableQuantity()
	return &dto.PartResponse{
		ID:                part.ID,
		Name:              part.Name,
		Sku:               part.Sku,
		Quantity:          part.Quantity,
		LockedQuantity:    part.LockedQuantity,
		AvailableQuantity: available,
		MinQuantity:       part.MinQuantity,
		UnitPrice:         part.UnitPrice,
		IsLowStock:        available <= part.MinQuantity,
		CreatedAt:         part.CreatedAt,
		UpdatedAt:         part.UpdatedAt,
	}
}

func (s *PartService) toLockResponse(lock *model.PartLock) *dto.PartLockResponse {
	resp := &dto.PartLockResponse{
		ID:            lock.ID,
		RepairOrderID: lock.RepairOrderID,
		PartID:        lock.PartID,
		Quantity:      lock.Quantity,
		LockedBy:      lock.LockedBy,
		LockedAt:      lock.LockedAt,
		ReleasedAt:    lock.ReleasedAt,
	}

	if lock.Part.ID > 0 {
		resp.PartName = lock.Part.Name
	}
	if lock.LockedByUser.ID > 0 {
		resp.LockedByName = lock.LockedByUser.DisplayName
	}

	return resp
}

func init() {
	_ = json.Marshal
	_ = fmt.Sprintf
}
