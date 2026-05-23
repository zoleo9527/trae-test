package main

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	api.Get("/users", GetUsers)
	api.Get("/users/current", GetCurrentUser)

	api.Get("/defects", GetDefects)
	api.Get("/defects/:id", GetDefect)
	api.Post("/defects", CreateDefect)
	api.Put("/defects/:id", UpdateDefect)
	api.Put("/defects/:id/status", UpdateDefectStatus)
	api.Post("/defects/batch-status", BatchUpdateStatus)
	api.Delete("/defects/:id", DeleteDefect)

	api.Get("/spare-parts", GetSpareParts)
	api.Get("/defects/:id/spare-usages", GetSpareUsages)
	api.Post("/defects/:id/spare-usages", CreateSpareUsage)
}

func GetCurrentUser(c *fiber.Ctx) error {
	role := c.Get("X-User-Role", "inspector")
	var user User
	DB.Where("role = ?", role).First(&user)
	return c.JSON(user)
}

func GetUsers(c *fiber.Ctx) error {
	var users []User
	DB.Find(&users)
	return c.JSON(users)
}

func GetDefects(c *fiber.Ctx) error {
	status := c.Query("status")
	var defects []Defect

	query := DB.Order("created_at desc")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	query.Find(&defects)

	return c.JSON(defects)
}

func GetDefect(c *fiber.Ctx) error {
	id := c.Params("id")
	var defect Defect
	if err := DB.Preload("Histories", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at desc")
	}).First(&defect, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Defect not found"})
	}
	return c.JSON(defect)
}

func CreateDefect(c *fiber.Ctx) error {
	defect := new(Defect)
	if err := c.BodyParser(defect); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	defect.ID = uuid.New().String()
	defect.Status = StatusPending
	defect.CreatedAt = time.Now()
	defect.UpdatedAt = time.Now()

	userRole := UserRole(c.Get("X-User-Role", "inspector"))
	var user User
	DB.Where("role = ?", userRole).First(&user)
	defect.ReporterID = user.ID
	defect.ReporterName = user.Name

	DB.Create(defect)

	history := DefectHistory{
		ID:           uuid.New().String(),
		DefectID:     defect.ID,
		OldStatus:    "",
		NewStatus:    StatusPending,
		Action:       "创建缺陷",
		OperatorID:   user.ID,
		OperatorName: user.Name,
		Remark:       defect.Remark,
		CreatedAt:    time.Now(),
	}
	DB.Create(&history)

	return c.JSON(defect)
}

func UpdateDefect(c *fiber.Ctx) error {
	id := c.Params("id")
	defect := new(Defect)
	if err := c.BodyParser(defect); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	oldDefect := Defect{}
	DB.First(&oldDefect, "id = ?", id)

	if oldDefect.ID == "" {
		return c.Status(404).JSON(fiber.Map{"error": "Defect not found"})
	}

	defect.UpdatedAt = time.Now()
	DB.Model(&oldDefect).Updates(defect)

	return c.JSON(oldDefect)
}

func UpdateDefectStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	var req struct {
		Status     DefectStatus `json:"status"`
		Remark     string       `json:"remark"`
		AssigneeID string       `json:"assignee_id"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	defect := Defect{}
	DB.First(&defect, "id = ?", id)

	if defect.ID == "" {
		return c.Status(404).JSON(fiber.Map{"error": "Defect not found"})
	}

	oldStatus := defect.Status
	userRole := UserRole(c.Get("X-User-Role", "inspector"))
	var user User
	DB.Where("role = ?", userRole).First(&user)

	var action string
	switch req.Status {
	case StatusAssigned:
		action = "派单"
		var assignee User
		DB.First(&assignee, "id = ?", req.AssigneeID)
		defect.AssigneeID = assignee.ID
		defect.AssigneeName = assignee.Name
	case StatusInProgress:
		action = "开始处理"
		defect.DowntimeStart = &[]time.Time{time.Now()}[0]
	case StatusPendingReview:
		action = "提交整改"
	case StatusRejected:
		action = "驳回"
	case StatusClosed:
		action = "关闭工单"
		if defect.DowntimeStart != nil {
			defect.DowntimeEnd = &[]time.Time{time.Now()}[0]
			defect.DowntimeMinutes = int(time.Since(*defect.DowntimeStart).Minutes())
		}
	case StatusNeedReview:
		action = "标记需回查"
	}

	defect.Status = req.Status
	defect.UpdatedAt = time.Now()
	DB.Save(&defect)

	history := DefectHistory{
		ID:           uuid.New().String(),
		DefectID:     defect.ID,
		OldStatus:    oldStatus,
		NewStatus:    req.Status,
		Action:       action,
		OperatorID:   user.ID,
		OperatorName: user.Name,
		Remark:       req.Remark,
		CreatedAt:    time.Now(),
	}
	DB.Create(&history)

	return c.JSON(defect)
}

func BatchUpdateStatus(c *fiber.Ctx) error {
	var req struct {
		IDs        []string     `json:"ids"`
		Status     DefectStatus `json:"status"`
		Remark     string       `json:"remark"`
		AssigneeID string       `json:"assignee_id"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	userRole := UserRole(c.Get("X-User-Role", "inspector"))
	var user User
	DB.Where("role = ?", userRole).First(&user)

	var assignee User
	if req.AssigneeID != "" {
		DB.First(&assignee, "id = ?", req.AssigneeID)
	}

	for _, id := range req.IDs {
		defect := Defect{}
		DB.First(&defect, "id = ?", id)
		if defect.ID == "" {
			continue
		}

		oldStatus := defect.Status
		defect.Status = req.Status
		defect.UpdatedAt = time.Now()

		var action string
		if req.Status == StatusAssigned && assignee.ID != "" {
			action = "批量派单"
			defect.AssigneeID = assignee.ID
			defect.AssigneeName = assignee.Name
		} else {
			action = "批量更新"
		}

		DB.Save(&defect)

		history := DefectHistory{
			ID:           uuid.New().String(),
			DefectID:     defect.ID,
			OldStatus:    oldStatus,
			NewStatus:    req.Status,
			Action:       action,
			OperatorID:   user.ID,
			OperatorName: user.Name,
			Remark:       req.Remark,
			CreatedAt:    time.Now(),
		}
		DB.Create(&history)
	}

	return c.JSON(fiber.Map{"success": true})
}

func DeleteDefect(c *fiber.Ctx) error {
	id := c.Params("id")
	DB.Delete(&Defect{}, "id = ?", id)
	DB.Delete(&DefectHistory{}, "defect_id = ?", id)
	return c.JSON(fiber.Map{"success": true})
}

func GetSpareParts(c *fiber.Ctx) error {
	var parts []SparePart
	DB.Find(&parts)
	return c.JSON(parts)
}

func GetSpareUsages(c *fiber.Ctx) error {
	defectID := c.Params("id")
	var usages []SparePartUsage
	DB.Where("defect_id = ?", defectID).Order("created_at desc").Find(&usages)
	return c.JSON(usages)
}

func CreateSpareUsage(c *fiber.Ctx) error {
	defectID := c.Params("id")
	var req struct {
		SparePartID string `json:"spare_part_id"`
		Quantity    int    `json:"quantity"`
		Remark      string `json:"remark"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if req.Quantity <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "领用数量必须大于0"})
	}

	var part SparePart
	if err := DB.First(&part, "id = ?", req.SparePartID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "备件不存在"})
	}

	if part.Stock < req.Quantity {
		return c.Status(400).JSON(fiber.Map{"error": "库存不足"})
	}

	userRole := UserRole(c.Get("X-User-Role", "inspector"))
	var user User
	DB.Where("role = ?", userRole).First(&user)

	part.Stock -= req.Quantity
	DB.Save(&part)

	usage := SparePartUsage{
		ID:             uuid.New().String(),
		DefectID:       defectID,
		SparePartID:    part.ID,
		SparePartName:  part.Name,
		SparePartModel: part.Model,
		Quantity:       req.Quantity,
		Unit:           part.Unit,
		OperatorID:     user.ID,
		OperatorName:   user.Name,
		Remark:         req.Remark,
		CreatedAt:      time.Now(),
	}
	DB.Create(&usage)

	var defect Defect
	DB.First(&defect, "id = ?", defectID)
	if defect.ID != "" {
		quantityStr := strconv.Itoa(req.Quantity)
		if defect.SpareParts == "" {
			defect.SpareParts = part.Name + " x" + quantityStr
		} else {
			defect.SpareParts += "; " + part.Name + " x" + quantityStr
		}
		DB.Save(&defect)
	}

	quantityStr := strconv.Itoa(req.Quantity)
	history := DefectHistory{
		ID:           uuid.New().String(),
		DefectID:     defectID,
		OldStatus:    defect.Status,
		NewStatus:    defect.Status,
		Action:       "领用备件",
		OperatorID:   user.ID,
		OperatorName: user.Name,
		Remark:       part.Name + " x" + quantityStr + " - " + req.Remark,
		CreatedAt:    time.Now(),
	}
	DB.Create(&history)

	return c.JSON(usage)
}
