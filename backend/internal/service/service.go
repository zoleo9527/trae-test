package service

import (
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/cultural-store/inspection-service/internal/model"
	"github.com/cultural-store/inspection-service/internal/repository"
	"github.com/cultural-store/inspection-service/internal/worker"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo      *repository.Repo
	jwtSecret string
	jwtExpire int
	worker    *worker.AsyncWorker
}

func NewService(repo *repository.Repo, jwtSecret string, jwtExpireHours string, w *worker.AsyncWorker) *Service {
	hours, _ := strconv.Atoi(jwtExpireHours)
	if hours < 1 {
		hours = 72
	}
	return &Service{repo: repo, jwtSecret: jwtSecret, jwtExpire: hours, worker: w}
}

func (s *Service) Login(username, password string) (*model.LoginResponse, error) {
	user, err := s.repo.GetUserByUsername(username)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}
	token, err := s.generateToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}
	return &model.LoginResponse{Token: token, User: *user}, nil
}

func (s *Service) generateToken(user *model.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":         user.ID,
		"username":    user.Username,
		"display_name": user.DisplayName,
		"role":        user.Role,
		"exp":         time.Now().Add(time.Duration(s.jwtExpire) * time.Hour).Unix(),
	}
	if user.StoreID != nil {
		claims["store_id"] = *user.StoreID
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *Service) GetCurrentUser(userID string) (*model.User, error) {
	return s.repo.GetUserByID(userID)
}

func (s *Service) ListStores(f model.ListFilter) (*model.PaginatedResult, error) {
	stores, total, err := s.repo.ListStores(f)
	if err != nil {
		return nil, err
	}
	return paginated(stores, total, f.Page, f.PageSize), nil
}

func (s *Service) ListUsers(f model.ListFilter) (*model.PaginatedResult, error) {
	users, total, err := s.repo.ListUsers(f)
	if err != nil {
		return nil, err
	}
	return paginated(users, total, f.Page, f.PageSize), nil
}

func (s *Service) ListInspections(f model.ListFilter) (*model.PaginatedResult, error) {
	inspections, total, err := s.repo.ListInspections(f)
	if err != nil {
		return nil, err
	}
	return paginated(inspections, total, f.Page, f.PageSize), nil
}

func (s *Service) GetInspection(id string) (*model.Inspection, error) {
	return s.repo.GetInspectionByID(id)
}

func (s *Service) CreateInspection(req model.CreateInspectionRequest, operatorID, operatorName string) (*model.Inspection, error) {
	inspectedAt := time.Now()
	if req.InspectedAt != "" {
		if t, err := time.Parse(time.RFC3339, req.InspectedAt); err == nil {
			inspectedAt = t
		}
	}
	ins := &model.Inspection{
		StoreID:        req.StoreID,
		InspectorID:    operatorID,
		Title:          req.Title,
		InspectionType: req.InspectionType,
		Status:         "draft",
		Notes:          req.Notes,
		InspectedAt:    inspectedAt,
	}
	if err := s.repo.CreateInspection(ins); err != nil {
		return nil, err
	}
	s.auditLog("inspection", ins.ID, "create", nil, ins, operatorID, operatorName, "创建巡店记录")
	return ins, nil
}

func (s *Service) UpdateInspection(id string, req model.UpdateInspectionRequest, operatorID, operatorName string) (*model.Inspection, error) {
	old, err := s.repo.GetInspectionByID(id)
	if err != nil {
		return nil, fmt.Errorf("inspection not found")
	}
	oldVal := snapshotInspection(old)
	if req.Title != "" {
		old.Title = req.Title
	}
	if req.InspectionType != "" {
		old.InspectionType = req.InspectionType
	}
	if req.Notes != "" {
		old.Notes = req.Notes
	}
	statusChanged := false
	if req.Status != "" && req.Status != old.Status {
		old.Status = req.Status
		statusChanged = true
	}
	if err := s.repo.UpdateInspection(old); err != nil {
		return nil, err
	}
	newVal := snapshotInspection(old)
	action := "update"
	note := "更新巡店记录"
	if statusChanged {
		action = "status_change"
		note = fmt.Sprintf("状态变更为 %s", old.Status)
	}
	s.auditLog("inspection", id, action, oldVal, newVal, operatorID, operatorName, note)
	return old, nil
}

func (s *Service) GetInspectionItems(inspectionID string) ([]model.InspectionItem, error) {
	return s.repo.ListInspectionItems(inspectionID)
}

func (s *Service) CreateInspectionItem(inspectionID string, req model.CreateInspectionItemRequest, operatorID, operatorName string) (*model.InspectionItem, error) {
	item := &model.InspectionItem{
		InspectionID: inspectionID,
		Category:     req.Category,
		Description:  req.Description,
		Severity:     req.Severity,
		Status:       "open",
	}
	if req.AssigneeID != "" {
		item.AssigneeID = &req.AssigneeID
	}
	if err := s.repo.CreateInspectionItem(item); err != nil {
		return nil, err
	}
	s.auditLog("inspection_item", item.ID, "create", nil, item, operatorID, operatorName, "创建巡店检查项")
	if req.AssigneeID != "" {
		s.auditLog("inspection_item", item.ID, "assign", nil, map[string]string{"assignee_id": req.AssigneeID}, operatorID, operatorName, "指派责任人")
	}
	return item, nil
}

func (s *Service) UpdateInspectionItem(id string, req model.UpdateInspectionItemRequest, operatorID, operatorName string) (*model.InspectionItem, error) {
	old, err := s.repo.GetInspectionItemByID(id)
	if err != nil {
		return nil, fmt.Errorf("inspection item not found")
	}
	oldVal := snapshotItem(old)
	if req.Category != "" {
		old.Category = req.Category
	}
	if req.Description != "" {
		old.Description = req.Description
	}
	if req.Severity != "" {
		old.Severity = req.Severity
	}
	if req.AssigneeID != "" {
		old.AssigneeID = &req.AssigneeID
		s.auditLog("inspection_item", id, "assign", nil, map[string]string{"assignee_id": req.AssigneeID}, operatorID, operatorName, "变更责任人")
	}
	statusChanged := false
	if req.Status != "" && req.Status != old.Status {
		old.Status = req.Status
		statusChanged = true
	}
	if err := s.repo.UpdateInspectionItem(old); err != nil {
		return nil, err
	}
	newVal := snapshotItem(old)
	action := "update"
	note := "更新检查项"
	if statusChanged {
		action = "status_change"
		note = fmt.Sprintf("状态变更为 %s", old.Status)
	}
	s.auditLog("inspection_item", id, action, oldVal, newVal, operatorID, operatorName, note)
	return old, nil
}

func (s *Service) GetInspectionPhotos(itemID string) ([]model.InspectionPhoto, error) {
	return s.repo.ListInspectionPhotos(itemID)
}

func (s *Service) CreateInspectionPhoto(itemID string, url, caption string, operatorID, operatorName string) (*model.InspectionPhoto, error) {
	photo := &model.InspectionPhoto{
		InspectionItemID: itemID,
		URL:              url,
		Caption:          caption,
		TakenAt:          time.Now(),
	}
	if err := s.repo.CreateInspectionPhoto(photo); err != nil {
		return nil, err
	}
	s.auditLog("inspection_photo", photo.ID, "create", nil, photo, operatorID, operatorName, "添加巡店照片")
	return photo, nil
}

func (s *Service) ListRectifications(f model.ListFilter) (*model.PaginatedResult, error) {
	rects, total, err := s.repo.ListRectifications(f)
	if err != nil {
		return nil, err
	}
	return paginated(rects, total, f.Page, f.PageSize), nil
}

func (s *Service) GetRectification(id string) (*model.Rectification, error) {
	return s.repo.GetRectificationByID(id)
}

func (s *Service) CreateRectification(req model.CreateRectificationRequest, operatorID, operatorName string) (*model.Rectification, error) {
	item, err := s.repo.GetInspectionItemByID(req.InspectionItemID)
	if err != nil {
		return nil, fmt.Errorf("inspection item not found")
	}
	ins, err := s.repo.GetInspectionByID(item.InspectionID)
	if err != nil {
		return nil, fmt.Errorf("inspection not found")
	}
	rect := &model.Rectification{
		InspectionItemID: req.InspectionItemID,
		StoreID:          ins.StoreID,
		Title:            req.Title,
		Description:      req.Description,
		Severity:         req.Severity,
		Status:           "pending",
	}
	if req.AssigneeID != "" {
		rect.AssigneeID = &req.AssigneeID
	}
	if req.DueDate != "" {
		if t, err := time.Parse(time.RFC3339, req.DueDate); err == nil {
			rect.DueDate = &t
		}
	}
	if err := s.repo.CreateRectification(rect); err != nil {
		return nil, err
	}
	oldItem := *item
	item.Status = "in_rectification"
	if err := s.repo.UpdateInspectionItem(item); err != nil {
		log.Printf("failed to update item status: %v", err)
	}
	s.auditLog("inspection_item", item.ID, "status_change", oldItem.Status, item.Status, operatorID, operatorName, "检查项进入整改状态")
	s.auditLog("rectification", rect.ID, "create", nil, rect, operatorID, operatorName, "创建整改单")
	if req.AssigneeID != "" {
		s.auditLog("rectification", rect.ID, "assign", nil, map[string]string{"assignee_id": req.AssigneeID}, operatorID, operatorName, "指派整改责任人")
	}
	s.worker.EnqueueInventorySyncCheck(ins.StoreID)
	return rect, nil
}

func (s *Service) UpdateRectification(id string, req model.UpdateRectificationRequest, operatorID, operatorName string) (*model.Rectification, error) {
	old, err := s.repo.GetRectificationByID(id)
	if err != nil {
		return nil, fmt.Errorf("rectification not found")
	}
	oldVal := snapshotRectification(old)
	if req.Title != "" {
		old.Title = req.Title
	}
	if req.Description != "" {
		old.Description = req.Description
	}
	if req.Severity != "" {
		old.Severity = req.Severity
	}
	if req.AssigneeID != "" {
		old.AssigneeID = &req.AssigneeID
		s.auditLog("rectification", id, "assign", nil, map[string]string{"assignee_id": req.AssigneeID}, operatorID, operatorName, "变更整改责任人")
	}
	if req.VerifierID != "" {
		old.VerifierID = &req.VerifierID
		s.auditLog("rectification", id, "assign", nil, map[string]string{"verifier_id": req.VerifierID}, operatorID, operatorName, "指定回查验证人")
	}
	if req.DueDate != "" {
		if t, err := time.Parse(time.RFC3339, req.DueDate); err == nil {
			old.DueDate = &t
		}
	}
	statusChanged := false
	if req.Status != "" && req.Status != old.Status {
		oldVal := old.Status
		old.Status = req.Status
		statusChanged = true
		if req.Status == "verified" || req.Status == "closed" {
			now := time.Now()
			old.ResolvedAt = &now
		}
		s.auditLog("rectification", id, "status_change", oldVal, req.Status, operatorID, operatorName,
			fmt.Sprintf("整改状态从 %s 变更为 %s", oldVal, req.Status))
		if req.Status == "closed" {
			item, _ := s.repo.GetInspectionItemByID(old.InspectionItemID)
			if item != nil && item.Status != "resolved" {
				item.Status = "resolved"
				s.repo.UpdateInspectionItem(item)
				s.auditLog("inspection_item", item.ID, "status_change", "in_rectification", "resolved", operatorID, operatorName, "整改关闭，检查项标记为已解决")
			}
		}
	}
	if err := s.repo.UpdateRectification(old); err != nil {
		return nil, err
	}
	newVal := snapshotRectification(old)
	action := "update"
	note := "更新整改单"
	if statusChanged {
		action = "status_change"
		note = fmt.Sprintf("整改状态变更为 %s", old.Status)
	}
	s.auditLog("rectification", id, action, oldVal, newVal, operatorID, operatorName, note)
	return old, nil
}

func (s *Service) GetRectificationPhotos(rectID string) ([]model.RectificationPhoto, error) {
	return s.repo.ListRectificationPhotos(rectID)
}

func (s *Service) CreateRectificationPhoto(rectID, photoType, url, caption string, operatorID, operatorName string) (*model.RectificationPhoto, error) {
	photo := &model.RectificationPhoto{
		RectificationID: rectID,
		PhotoType:       photoType,
		URL:             url,
		Caption:         caption,
		TakenByID:       &operatorID,
		TakenAt:         time.Now(),
	}
	if err := s.repo.CreateRectificationPhoto(photo); err != nil {
		return nil, err
	}
	s.auditLog("rectification_photo", photo.ID, "create", nil, photo, operatorID, operatorName,
		fmt.Sprintf("添加整改%s照片", photoType))
	return photo, nil
}

func (s *Service) GetRectificationComments(rectID string) ([]model.RectificationComment, error) {
	return s.repo.ListRectificationComments(rectID)
}

func (s *Service) CreateRectificationComment(rectID, content, operatorID, operatorName string) (*model.RectificationComment, error) {
	comment := &model.RectificationComment{
		RectificationID: rectID,
		AuthorID:        operatorID,
		Content:         content,
	}
	if err := s.repo.CreateRectificationComment(comment); err != nil {
		return nil, err
	}
	s.auditLog("rectification_comment", comment.ID, "comment", nil, map[string]string{"content": content}, operatorID, operatorName, "添加整改备注")
	return comment, nil
}

func (s *Service) ListProducts(f model.ListFilter) (*model.PaginatedResult, error) {
	products, total, err := s.repo.ListProducts(f)
	if err != nil {
		return nil, err
	}
	return paginated(products, total, f.Page, f.PageSize), nil
}

func (s *Service) GetProduct(id string) (*model.Product, error) {
	return s.repo.GetProductByID(id)
}

func (s *Service) CreateProduct(req model.CreateProductRequest, operatorID, operatorName string) (*model.Product, error) {
	p := &model.Product{
		Name:           req.Name,
		SKU:            req.SKU,
		Category:       req.Category,
		IsCobranded:    req.IsCobranded,
		CobrandPartner: req.CobrandPartner,
		Status:         req.Status,
	}
	if req.Status == "" {
		p.Status = "active"
	}
	if req.StoreID != "" {
		p.StoreID = &req.StoreID
	}
	if err := s.repo.CreateProduct(p); err != nil {
		return nil, err
	}
	s.auditLog("product", p.ID, "create", nil, p, operatorID, operatorName, "创建商品")
	if p.IsCobranded {
		s.worker.EnqueueCobrandSync(p.ID)
	}
	return p, nil
}

func (s *Service) UpdateProduct(id string, req model.UpdateProductRequest, operatorID, operatorName string) (*model.Product, error) {
	old, err := s.repo.GetProductByID(id)
	if err != nil {
		return nil, fmt.Errorf("product not found")
	}
	oldVal := snapshotProduct(old)
	if req.Name != "" {
		old.Name = req.Name
	}
	if req.Category != "" {
		old.Category = req.Category
	}
	old.IsCobranded = req.IsCobranded
	old.CobrandPartner = req.CobrandPartner
	statusChanged := false
	if req.Status != "" && req.Status != old.Status {
		oldVal := old.Status
		old.Status = req.Status
		statusChanged = true
		s.auditLog("product", id, "status_change", oldVal, req.Status, operatorID, operatorName,
			fmt.Sprintf("商品状态从 %s 变更为 %s", oldVal, req.Status))
	}
	if req.StoreID != "" {
		old.StoreID = &req.StoreID
	} else {
		old.StoreID = nil
	}
	if err := s.repo.UpdateProduct(old); err != nil {
		return nil, err
	}
	newVal := snapshotProduct(old)
	action := "update"
	note := "更新商品"
	if statusChanged {
		action = "status_change"
		note = "商品状态变更"
	}
	s.auditLog("product", id, action, oldVal, newVal, operatorID, operatorName, note)
	if old.IsCobranded && statusChanged {
		s.worker.EnqueueCobrandSync(id)
	}
	return old, nil
}

func (s *Service) ListInventory(f model.ListFilter) (*model.PaginatedResult, error) {
	records, total, err := s.repo.ListInventory(f)
	if err != nil {
		return nil, err
	}
	return paginated(records, total, f.Page, f.PageSize), nil
}

func (s *Service) AdjustInventory(req model.AdjustInventoryRequest, operatorID, operatorName string) (*model.InventoryRecord, error) {
	old, _ := s.repo.GetInventory(req.StoreID, req.ProductID)
	inv := &model.InventoryRecord{
		StoreID:   req.StoreID,
		ProductID: req.ProductID,
		Quantity:  req.Quantity,
		SystemQty: req.Quantity,
	}
	now := time.Now()
	inv.LastCheckedAt = &now
	if err := s.repo.UpsertInventory(inv); err != nil {
		return nil, err
	}
	if old != nil {
		s.auditLog("inventory", inv.ID, "update",
			map[string]int{"quantity": old.Quantity, "system_quantity": old.SystemQty},
			map[string]int{"quantity": inv.Quantity, "system_quantity": inv.SystemQty},
			operatorID, operatorName, fmt.Sprintf("库存调整: %d -> %d", old.Quantity, inv.Quantity))
	} else {
		s.auditLog("inventory", inv.ID, "create", nil,
			map[string]int{"quantity": inv.Quantity, "system_quantity": inv.SystemQty},
			operatorID, operatorName, "创建库存记录")
	}
	s.worker.EnqueueInventorySyncCheck(req.StoreID)
	return inv, nil
}

func (s *Service) ListReplenishmentOrders(f model.ListFilter) (*model.PaginatedResult, error) {
	orders, total, err := s.repo.ListReplenishmentOrders(f)
	if err != nil {
		return nil, err
	}
	return paginated(orders, total, f.Page, f.PageSize), nil
}

func (s *Service) GetReplenishmentOrder(id string) (*model.ReplenishmentOrder, error) {
	return s.repo.GetReplenishmentOrderByID(id)
}

func (s *Service) CreateReplenishmentOrder(req model.CreateReplenishmentRequest, operatorID, operatorName string) (*model.ReplenishmentOrder, error) {
	o := &model.ReplenishmentOrder{
		StoreID:     req.StoreID,
		CreatedByID: operatorID,
		Status:      "draft",
		Notes:       req.Notes,
	}
	if err := s.repo.CreateReplenishmentOrder(o); err != nil {
		return nil, err
	}
	s.auditLog("replenishment_order", o.ID, "create", nil, o, operatorID, operatorName, "创建补货单")
	for _, item := range req.Items {
		ri := &model.ReplenishmentItem{
			OrderID:      o.ID,
			ProductID:    item.ProductID,
			RequestedQty: item.RequestedQty,
		}
		if err := s.repo.CreateReplenishmentItem(ri); err != nil {
			log.Printf("failed to create replenishment item: %v", err)
		}
	}
	return o, nil
}

func (s *Service) UpdateReplenishmentOrderStatus(id, status string, operatorID, operatorName string) error {
	old, err := s.repo.GetReplenishmentOrderByID(id)
	if err != nil {
		return fmt.Errorf("order not found")
	}
	oldStatus := old.Status
	if oldStatus == status {
		return nil
	}
	finalStates := map[string]bool{"received": true, "cancelled": true}
	isFinal := finalStates[status]
	wasFinal := finalStates[oldStatus]
	if wasFinal && status != oldStatus {
		return fmt.Errorf("cannot change status from %s to %s: terminal state", oldStatus, status)
	}
	if err := s.repo.UpdateReplenishmentOrderStatus(id, status); err != nil {
		return err
	}
	s.auditLog("replenishment_order", id, "status_change", oldStatus, status, operatorID, operatorName,
		fmt.Sprintf("补货单状态从 %s 变更为 %s", oldStatus, status))
	if status == "received" && !wasFinal && isFinal {
		items, err := s.repo.ListReplenishmentItems(id)
		if err != nil {
			log.Printf("failed to load replenishment items: %v", err)
			return nil
		}
		for _, item := range items {
			qty := item.ReceivedQty
			if qty <= 0 {
				qty = item.ApprovedQty
			}
			if qty <= 0 {
				qty = item.RequestedQty
			}
			oldInv, _ := s.repo.GetInventory(old.StoreID, item.ProductID)
			oldQty := 0
			oldSys := 0
			if oldInv != nil {
				oldQty = oldInv.Quantity
				oldSys = oldInv.SystemQty
			}
			newQty := oldQty + qty
			newSys := oldSys + qty
			now := time.Now()
			inv := &model.InventoryRecord{
				StoreID:       old.StoreID,
				ProductID:     item.ProductID,
				Quantity:        newQty,
				SystemQty:       newSys,
				LastCheckedAt: &now,
			}
			if err := s.repo.UpsertInventory(inv); err != nil {
				log.Printf("failed to update inventory: %v", err)
				continue
			}
			s.auditLog("inventory", inv.ID, "update",
				map[string]int{"quantity": oldQty, "system_quantity": oldSys},
				map[string]int{"quantity": newQty, "system_quantity": newSys},
				operatorID, operatorName,
				fmt.Sprintf("补货收货 %s %d件，库存 %d→%d", item.ProductName, qty, oldQty, newQty))
		}
		s.worker.EnqueueInventorySyncCheck(old.StoreID)
	}
	return nil
}

func (s *Service) GetReplenishmentItems(orderID string) ([]model.ReplenishmentItem, error) {
	return s.repo.ListReplenishmentItems(orderID)
}

func (s *Service) ListTransferOrders(f model.ListFilter) (*model.PaginatedResult, error) {
	orders, total, err := s.repo.ListTransferOrders(f)
	if err != nil {
		return nil, err
	}
	return paginated(orders, total, f.Page, f.PageSize), nil
}

func (s *Service) CreateTransferOrder(req model.CreateTransferRequest, operatorID, operatorName string) (*model.TransferOrder, error) {
	o := &model.TransferOrder{
		FromStoreID: req.FromStoreID,
		ToStoreID:   req.ToStoreID,
		CreatedByID: operatorID,
		Status:      "draft",
		Notes:       req.Notes,
	}
	if err := s.repo.CreateTransferOrder(o); err != nil {
		return nil, err
	}
	s.auditLog("transfer_order", o.ID, "create", nil, o, operatorID, operatorName, "创建调拨单")
	for _, item := range req.Items {
		ti := &model.TransferItem{
			OrderID:   o.ID,
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
		}
		if err := s.repo.CreateTransferItem(ti); err != nil {
			log.Printf("failed to create transfer item: %v", err)
		}
	}
	return o, nil
}

func (s *Service) UpdateTransferOrderStatus(id, status string, operatorID, operatorName string) error {
	old, err := s.repo.GetTransferOrderByID(id)
	if err != nil {
		return fmt.Errorf("order not found")
	}
	oldStatus := old.Status
	if oldStatus == status {
		return nil
	}
	finalStates := map[string]bool{"received": true, "cancelled": true}
	isFinal := finalStates[status]
	wasFinal := finalStates[oldStatus]
	if wasFinal && status != oldStatus {
		return fmt.Errorf("cannot change status from %s to %s: terminal state", oldStatus, status)
	}
	if err := s.repo.UpdateTransferOrderStatus(id, status); err != nil {
		return err
	}
	s.auditLog("transfer_order", id, "status_change", oldStatus, status, operatorID, operatorName,
		fmt.Sprintf("调拨单状态从 %s 变更为 %s", oldStatus, status))
	if status == "received" && !wasFinal && isFinal {
		items, err := s.repo.ListTransferItems(id)
		if err != nil {
			log.Printf("failed to load transfer items: %v", err)
			return nil
		}
		for _, item := range items {
			qty := item.Quantity
			fromStore := old.FromStoreID
			toStore := old.ToStoreID

			oldInvFrom, _ := s.repo.GetInventory(fromStore, item.ProductID)
			oldQtyFrom := 0
			oldSysFrom := 0
			if oldInvFrom != nil {
				oldQtyFrom = oldInvFrom.Quantity
				oldSysFrom = oldInvFrom.SystemQty
			}
			newQtyFrom := oldQtyFrom - qty
			newSysFrom := oldSysFrom - qty
			if newQtyFrom < 0 {
				newQtyFrom = 0
			}
			now := time.Now()
			invFrom := &model.InventoryRecord{
				StoreID:       fromStore,
				ProductID:     item.ProductID,
				Quantity:        newQtyFrom,
				SystemQty:       newSysFrom,
				LastCheckedAt: &now,
			}
			if err := s.repo.UpsertInventory(invFrom); err != nil {
				log.Printf("failed to update from-store inventory: %v", err)
				continue
			}
			s.auditLog("inventory", invFrom.ID, "update",
				map[string]int{"quantity": oldQtyFrom, "system_quantity": oldSysFrom},
				map[string]int{"quantity": newQtyFrom, "system_quantity": newSysFrom},
				operatorID, operatorName,
				fmt.Sprintf("调拨出库 %s %d件，库存 %d→%d", item.ProductName, qty, oldQtyFrom, newQtyFrom))

			oldInvTo, _ := s.repo.GetInventory(toStore, item.ProductID)
			oldQtyTo := 0
			oldSysTo := 0
			if oldInvTo != nil {
				oldQtyTo = oldInvTo.Quantity
				oldSysTo = oldInvTo.SystemQty
			}
			newQtyTo := oldQtyTo + qty
			newSysTo := oldSysTo + qty
			invTo := &model.InventoryRecord{
				StoreID:       toStore,
				ProductID:     item.ProductID,
				Quantity:        newQtyTo,
				SystemQty:       newSysTo,
				LastCheckedAt: &now,
			}
			if err := s.repo.UpsertInventory(invTo); err != nil {
				log.Printf("failed to update to-store inventory: %v", err)
				continue
			}
			s.auditLog("inventory", invTo.ID, "update",
				map[string]int{"quantity": oldQtyTo, "system_quantity": oldSysTo},
				map[string]int{"quantity": newQtyTo, "system_quantity": newSysTo},
				operatorID, operatorName,
				fmt.Sprintf("调拨入库 %s %d件，库存 %d→%d", item.ProductName, qty, oldQtyTo, newQtyTo))
		}
		s.worker.EnqueueInventorySyncCheck(old.ToStoreID)
		s.worker.EnqueueInventorySyncCheck(old.FromStoreID)
	}
	return nil
}

func (s *Service) GetTransferOrder(id string) (*model.TransferOrder, error) {
	return s.repo.GetTransferOrderByID(id)
}

func (s *Service) GetTransferItems(orderID string) ([]model.TransferItem, error) {
	return s.repo.ListTransferItems(orderID)
}

func (s *Service) GetMemberRedemption(id string) (*model.MemberRedemption, error) {
	return s.repo.GetMemberRedemptionByID(id)
}

func (s *Service) ListMemberRedemptions(f model.ListFilter) (*model.PaginatedResult, error) {
	redemptions, total, err := s.repo.ListMemberRedemptions(f)
	if err != nil {
		return nil, err
	}
	return paginated(redemptions, total, f.Page, f.PageSize), nil
}

func (s *Service) CreateMemberRedemption(req model.CreateRedemptionRequest, operatorID, operatorName string) (*model.MemberRedemption, error) {
	mr := &model.MemberRedemption{
		MemberPhone: req.MemberPhone,
		ProductID:   req.ProductID,
		StoreID:     req.StoreID,
		Quantity:    req.Quantity,
		Status:      "pending",
	}
	if err := s.repo.CreateMemberRedemption(mr); err != nil {
		return nil, err
	}
	s.auditLog("member_redemption", mr.ID, "create", nil, mr, operatorID, operatorName, "创建会员兑换")
	return mr, nil
}

func (s *Service) FulfillMemberRedemption(id, status string, operatorID, operatorName string) error {
	mr, err := s.repo.GetMemberRedemptionByID(id)
	if err != nil {
		return fmt.Errorf("redemption not found")
	}
	oldStatus := mr.Status
	if oldStatus == status {
		return nil
	}
	finalStates := map[string]bool{"fulfilled": true, "cancelled": true}
	isFinal := finalStates[status]
	wasFinal := finalStates[oldStatus]
	if wasFinal && status != oldStatus {
		return fmt.Errorf("cannot change status from %s to %s: terminal state", oldStatus, status)
	}
	if err := s.repo.FulfillMemberRedemption(id, operatorID, status); err != nil {
		return err
	}
	s.auditLog("member_redemption", id, "status_change", oldStatus, status, operatorID, operatorName,
		fmt.Sprintf("会员兑换状态从 %s 变更为 %s", oldStatus, status))
	if status == "fulfilled" && !wasFinal && isFinal {
		qty := mr.Quantity
		storeID := mr.StoreID
		productID := mr.ProductID
		oldInv, _ := s.repo.GetInventory(storeID, productID)
		oldQty := 0
		oldSys := 0
		if oldInv != nil {
			oldQty = oldInv.Quantity
			oldSys = oldInv.SystemQty
		}
		newQty := oldQty - qty
		newSys := oldSys - qty
		if newQty < 0 {
			newQty = 0
		}
		now := time.Now()
		inv := &model.InventoryRecord{
			StoreID:       storeID,
			ProductID:     productID,
			Quantity:        newQty,
			SystemQty:       newSys,
			LastCheckedAt: &now,
		}
		if err := s.repo.UpsertInventory(inv); err != nil {
			log.Printf("failed to update inventory: %v", err)
		} else {
			s.auditLog("inventory", inv.ID, "update",
				map[string]int{"quantity": oldQty, "system_quantity": oldSys},
				map[string]int{"quantity": newQty, "system_quantity": newSys},
				operatorID, operatorName,
				fmt.Sprintf("会员兑换履约 %s %d件，库存 %d→%d", mr.ProductName, qty, oldQty, newQty))
		}
		s.worker.EnqueueInventorySyncCheck(storeID)
	}
	return nil
}

func (s *Service) ListAuditLogs(entityType, entityID string, f model.ListFilter) (*model.PaginatedResult, error) {
	logs, total, err := s.repo.ListAuditLogs(entityType, entityID, f)
	if err != nil {
		return nil, err
	}
	return paginated(logs, total, f.Page, f.PageSize), nil
}

func (s *Service) auditLog(entityType, entityID, action string, oldVal, newVal interface{}, operatorID, operatorName, note string) {
	var oldJSON, newJSON *string
	if oldVal != nil {
		if b, err := json.Marshal(oldVal); err == nil {
			s := string(b)
			oldJSON = &s
		}
	}
	if newVal != nil {
		if b, err := json.Marshal(newVal); err == nil {
			s := string(b)
			newJSON = &s
		}
	}
	auditLog := &model.AuditLog{
		EntityType:   entityType,
		EntityID:     entityID,
		Action:       action,
		OldValue:     oldJSON,
		NewValue:     newJSON,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		Note:         note,
	}
	if err := s.repo.CreateAuditLog(auditLog); err != nil {
		log.Printf("failed to create audit log: %v", err)
	}
}

func paginated(data interface{}, total, page, pageSize int) *model.PaginatedResult {
	totalPages := total / pageSize
	if total%pageSize > 0 {
		totalPages++
	}
	return &model.PaginatedResult{
		Data:       data,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}
}

func snapshotInspection(ins *model.Inspection) map[string]interface{} {
	return map[string]interface{}{
		"title": ins.Title, "status": ins.Status, "inspection_type": ins.InspectionType,
		"notes": ins.Notes, "store_id": ins.StoreID,
	}
}

func snapshotItem(item *model.InspectionItem) map[string]interface{} {
	return map[string]interface{}{
		"category": item.Category, "description": item.Description, "severity": item.Severity,
		"status": item.Status, "assignee_id": item.AssigneeID,
	}
}

func snapshotRectification(rect *model.Rectification) map[string]interface{} {
	return map[string]interface{}{
		"title": rect.Title, "description": rect.Description, "severity": rect.Severity,
		"status": rect.Status, "assignee_id": rect.AssigneeID, "verifier_id": rect.VerifierID,
		"due_date": rect.DueDate, "resolved_at": rect.ResolvedAt,
	}
}

func snapshotProduct(p *model.Product) map[string]interface{} {
	return map[string]interface{}{
		"name": p.Name, "sku": p.SKU, "category": p.Category, "status": p.Status,
		"is_cobranded": p.IsCobranded, "cobrand_partner": p.CobrandPartner, "store_id": p.StoreID,
	}
}
