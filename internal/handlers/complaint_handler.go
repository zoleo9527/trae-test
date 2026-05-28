package handlers

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"water-delivery-service/internal/config"
	"water-delivery-service/internal/middleware"
	"water-delivery-service/internal/services"
	"water-delivery-service/internal/utils"
	"water-delivery-service/pkg/dto"
)

type ComplaintHandler struct {
	complaintService  *services.ComplaintService
	redeliveryService *services.RedeliveryService
	compensationService *services.CompensationService
}

func NewComplaintHandler() *ComplaintHandler {
	return &ComplaintHandler{
		complaintService:  services.NewComplaintService(),
		redeliveryService: services.NewRedeliveryService(),
		compensationService: services.NewCompensationService(),
	}
}

func (h *ComplaintHandler) Create(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	var req dto.CreateComplaintRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	complaint, err := h.complaintService.Create(&req, user.UserID)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(complaint)
}

func (h *ComplaintHandler) Query(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	var filter dto.ComplaintQueryFilter
	if err := c.QueryParser(&filter); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid query parameters"})
	}

	if stationIDStr := c.Query("station_id"); stationIDStr != "" {
		if sid, err := uuid.Parse(stationIDStr); err == nil {
			filter.StationID = &sid
		}
	}
	if customerIDStr := c.Query("customer_id"); customerIDStr != "" {
		if cid, err := uuid.Parse(customerIDStr); err == nil {
			filter.CustomerID = &cid
		}
	}
	if assignedToStr := c.Query("assigned_to"); assignedToStr != "" {
		if aid, err := uuid.Parse(assignedToStr); err == nil {
			filter.AssignedTo = &aid
		}
	}
	if priorityStr := c.Query("priority"); priorityStr != "" {
		if p, err := strconv.Atoi(priorityStr); err == nil {
			filter.Priority = &p
		}
	}
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil {
			filter.Page = p
		}
	}
	if pageSizeStr := c.Query("page_size"); pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil {
			filter.PageSize = ps
		}
	}

	result, err := h.complaintService.Query(&filter, user)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(result)
}

func (h *ComplaintHandler) GetDetail(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid complaint ID"})
	}

	complaint, err := h.complaintService.GetDetail(id, user)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(complaint)
}

func (h *ComplaintHandler) UpdateStatus(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid complaint ID"})
	}

	var req dto.UpdateComplaintStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	complaint, err := h.complaintService.UpdateStatus(id, user.UserID, user.Role, user.StationID, &req)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(complaint)
}

func (h *ComplaintHandler) Assign(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid complaint ID"})
	}

	var req dto.AssignComplaintRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	complaint, err := h.complaintService.Assign(id, user.UserID, user.Role, user.StationID, &req)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(complaint)
}

func (h *ComplaintHandler) AddNote(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid complaint ID"})
	}

	var req dto.AddNoteRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	note, err := h.complaintService.AddNote(id, user.UserID, user.Role, user.StationID, &req)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(note)
}

func (h *ComplaintHandler) UploadPhoto(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid complaint ID"})
	}

	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "No file uploaded"})
	}

	if file.Size > config.AppConfig.MaxUploadSize {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "File too large"})
	}

	description := c.FormValue("description", "")

	src, err := file.Open()
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to open file"})
	}
	defer src.Close()

	content, err := io.ReadAll(src)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read file"})
	}

	fileHash := utils.GenerateFileHash(content)
	ext := filepath.Ext(file.Filename)
	filename := id.String() + "_" + time.Now().Format("20060102150405") + ext
	filePath := filepath.Join(config.AppConfig.UploadDir, filename)

	if err := os.MkdirAll(config.AppConfig.UploadDir, 0755); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create upload directory"})
	}

	dst, err := os.Create(filePath)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create file"})
	}
	defer dst.Close()

	src.Seek(0, 0)
	if _, err := io.Copy(dst, src); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save file"})
	}

	fileURL := "/uploads/" + filename

	photo, err := h.complaintService.UploadPhoto(id, user.UserID, user.Role, user.StationID, fileURL, fileHash, file.Size, description)
	if err != nil {
		os.Remove(filePath)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(dto.UploadResponse{
		FileURL:     fileURL,
		FileHash:    fileHash,
		Description: description,
	})
}

func (h *ComplaintHandler) CreateRedelivery(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	complaintID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid complaint ID"})
	}

	var req dto.CreateRedeliveryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	req.ComplaintID = complaintID

	redelivery, err := h.redeliveryService.Create(&req, user.UserID)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(redelivery)
}

func (h *ComplaintHandler) UpdateRedeliveryStatus(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	redeliveryID, err := uuid.Parse(c.Params("redeliveryId"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid redelivery ID"})
	}

	var req dto.UpdateRedeliveryStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	redelivery, err := h.redeliveryService.UpdateStatus(redeliveryID, user.UserID, user.Role, user.StationID, &req)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(redelivery)
}

func (h *ComplaintHandler) CreateCompensation(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	complaintID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid complaint ID"})
	}

	var req dto.CreateCompensationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	req.ComplaintID = complaintID

	compensation, err := h.compensationService.Create(&req, user.UserID, user.Role, user.StationID)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(compensation)
}

func (h *ComplaintHandler) ApproveCompensation(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	compensationID, err := uuid.Parse(c.Params("compensationId"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid compensation ID"})
	}

	var req dto.ApproveCompensationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	compensation, err := h.compensationService.Approve(compensationID, user.UserID, user.Role, user.StationID, &req)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(compensation)
}

func (h *ComplaintHandler) GetMyRedeliveries(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	redeliveries, err := h.redeliveryService.GetByDriver(user.UserID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(redeliveries)
}

func (h *ComplaintHandler) GetPendingCompensations(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	compensations, err := h.compensationService.GetPendingApprovals(user.StationID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(compensations)
}

func (h *ComplaintHandler) MarkCompensationPaid(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	compensationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid compensation ID"})
	}

	compensation, err := h.compensationService.MarkPaid(compensationID, user.UserID)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(compensation)
}
