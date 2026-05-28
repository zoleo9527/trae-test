package handlers

import (
	"camp-server/internal/middleware"
	"camp-server/internal/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CreateExceptionRequest struct {
	Type        models.ExceptionType `json:"type"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Severity    string    `json:"severity"`
	ProductID   string    `json:"productId"`
	StoreID     string    `json:"storeId"`
	AssignedTo  string    `json:"assignedTo"`
}

type ResolveExceptionRequest struct {
	ResolutionNote string `json:"resolutionNote"`
	NeedReview     bool   `json:"needReview"`
}

type ReviewExceptionRequest struct {
	ReviewNote string `json:"reviewNote"`
}

func ListExceptions(c *fiber.Ctx) error {
	status := c.Query("status")
	exceptionType := c.Query("type")
	severity := c.Query("severity")
	assignedTo := c.Query("assignedTo")
	needReview := c.Query("needReview")

	query := models.DB.Model(&models.ExceptionRecord{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if exceptionType != "" {
		query = query.Where("type = ?", exceptionType)
	}
	if severity != "" {
		query = query.Where("severity = ?", severity)
	}
	if assignedTo != "" {
		query = query.Where("assigned_to = ?", assignedTo)
	}
	if needReview == "true" {
		query = query.Where("need_review = ?", true)
	}

	var exceptions []models.ExceptionRecord
	if err := query.Order("created_at DESC").Find(&exceptions).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(exceptions)
}

func GetException(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid exception ID",
		})
	}

	var exception models.ExceptionRecord
	if err := models.DB.First(&exception, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Exception not found",
		})
	}

	logs, _ := models.GetOperationLogs("exception", id)

	return c.JSON(fiber.Map{
		"exception": exception,
		"logs":      logs,
	})
}

func CreateException(c *fiber.Ctx) error {
	user := middleware.GetUser(c)

	var req CreateExceptionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	var productID *uuid.UUID
	var productSKU, productName string
	if req.ProductID != "" {
		pid, err := uuid.Parse(req.ProductID)
		if err == nil {
			productID = &pid
			var product models.CollabProduct
			if err := models.DB.First(&product, "id = ?", pid).Error; err == nil {
				productSKU = product.SKU
				productName = product.Name
			}
		}
	}

	var storeID *uuid.UUID
	var storeCode, storeName string
	if req.StoreID != "" {
		sid, err := uuid.Parse(req.StoreID)
		if err == nil {
			storeID = &sid
			var store models.Store
			if err := models.DB.First(&store, "id = ?", sid).Error; err == nil {
				storeCode = store.Code
				storeName = store.Name
			}
		}
	}

	var assignedTo *uuid.UUID
	var assignedToName string
	if req.AssignedTo != "" {
		aid, err := uuid.Parse(req.AssignedTo)
		if err == nil {
			assignedTo = &aid
			var assignee models.User
			if err := models.DB.First(&assignee, "id = ?", aid).Error; err == nil {
				assignedToName = assignee.Name
			}
		}
	}

	exception, err := models.CreateException(
		req.Type, req.Title, req.Description, req.Severity,
		productID, storeID, nil, nil,
		productSKU, productName, storeCode, storeName, "",
		user.ID, user.Name, assignedTo, assignedToName,
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(exception)
}

func AssignException(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid exception ID",
		})
	}

	var req struct {
		AssignedTo string `json:"assignedTo"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	assignedTo, err := uuid.Parse(req.AssignedTo)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid assigned user ID",
		})
	}

	var assignee models.User
	if err := models.DB.First(&assignee, "id = ?", assignedTo).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Assignee not found",
		})
	}

	var exception models.ExceptionRecord
	if err := models.DB.First(&exception, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Exception not found",
		})
	}

	oldException := exception
	exception.AssignedTo = &assignedTo
	exception.AssignedToName = assignee.Name
	exception.Status = models.ExceptionStatusHandling
	exception.UpdatedAt = time.Now()

	if err := models.DB.Save(&exception).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("exception", exception.ID, "assign", oldException, exception,
		"分配给"+assignee.Name+"处理", user.ID, user.Name, user.Role)

	return c.JSON(exception)
}

func ResolveException(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid exception ID",
		})
	}

	var req ResolveExceptionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	var exception models.ExceptionRecord
	if err := models.DB.First(&exception, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Exception not found",
		})
	}

	oldException := exception
	now := time.Now()
	exception.Status = models.ExceptionStatusResolved
	exception.ResolutionNote = req.ResolutionNote
	exception.NeedReview = req.NeedReview
	exception.ResolvedAt = &now
	exception.UpdatedAt = now

	if err := models.DB.Save(&exception).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("exception", exception.ID, "resolve", oldException, exception,
		req.ResolutionNote, user.ID, user.Name, user.Role)

	if exception.InspectionID != nil {
		var inspection models.Inspection
		if err := models.DB.First(&inspection, "id = ?", *exception.InspectionID).Error; err == nil {
			inspection.Status = models.InspectionStatusClosed
			inspection.ClosedAt = &now
			models.DB.Save(&inspection)
		}
	}

	return c.JSON(exception)
}

func ReviewException(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid exception ID",
		})
	}

	var req ReviewExceptionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	var exception models.ExceptionRecord
	if err := models.DB.First(&exception, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Exception not found",
		})
	}

	oldException := exception
	now := time.Now()
	exception.Status = models.ExceptionStatusReview
	exception.ReviewNote = req.ReviewNote
	exception.ReviewedBy = &user.ID
	exception.ReviewedByName = user.Name
	exception.ReviewedAt = &now
	exception.NeedReview = false
	exception.UpdatedAt = now

	if err := models.DB.Save(&exception).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("exception", exception.ID, "review", oldException, exception,
		req.ReviewNote, user.ID, user.Name, user.Role)

	return c.JSON(exception)
}

func ReopenException(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid exception ID",
		})
	}

	var exception models.ExceptionRecord
	if err := models.DB.First(&exception, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Exception not found",
		})
	}

	oldException := exception
	exception.Status = models.ExceptionStatusHandling
	exception.ResolvedAt = nil
	exception.ResolutionNote = ""
	exception.UpdatedAt = time.Now()

	if err := models.DB.Save(&exception).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("exception", exception.ID, "reopen", oldException, exception,
		"重新打开异常", user.ID, user.Name, user.Role)

	return c.JSON(exception)
}

func DeleteException(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid exception ID",
		})
	}

	var exception models.ExceptionRecord
	if err := models.DB.First(&exception, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Exception not found",
		})
	}

	if err := models.DB.Delete(&exception).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("exception", id, "delete", exception, nil,
		"删除异常记录", user.ID, user.Name, user.Role)

	return c.JSON(fiber.Map{
		"message": "Exception deleted successfully",
	})
}
