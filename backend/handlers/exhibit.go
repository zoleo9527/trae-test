package handlers

import (
	"gallery-system/database"
	"gallery-system/middleware"
	"gallery-system/models"
	"gallery-system/utils"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

type CreateExhibitRequest struct {
	ExhibitNo   string `json:"exhibit_no"`
	Name        string `json:"name"`
	Category    string `json:"category"`
	Artist      string `json:"artist"`
	Year        string `json:"year"`
	Material    string `json:"material"`
	Dimensions  string `json:"dimensions"`
	Location    string `json:"location"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url"`
}

type CreateTransferRequest struct {
	ExhibitID    uint                  `json:"exhibit_id"`
	ToStatus     models.ExhibitStatus  `json:"to_status"`
	ToLocation   string                `json:"to_location"`
	Reason       string                `json:"reason"`
}

func CreateExhibit(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)

	var req CreateExhibitRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "参数错误", err.Error())
	}

	exhibit := models.Exhibit{
		ExhibitNo:   req.ExhibitNo,
		Name:        req.Name,
		Category:    req.Category,
		Artist:      req.Artist,
		Year:        req.Year,
		Material:    req.Material,
		Dimensions:  req.Dimensions,
		Location:    req.Location,
		Status:      models.ExhibitInStorage,
		Description: req.Description,
		ImageURL:    req.ImageURL,
		CreatedBy:   claims.UserID,
	}

	if err := database.DB.Create(&exhibit).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "创建展品失败", err.Error())
	}

	_ = utils.CreateAuditLog(
		"exhibit", "create", "exhibit", &exhibit.ID, exhibit.ExhibitNo,
		claims.UserID, claims.Username, claims.Role, nil, exhibit,
		c.IP(), c.Get("User-Agent"), "",
	)

	return utils.JSONResponse(c, fiber.StatusCreated, true, "展品创建成功", exhibit)
}

func GetExhibit(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID格式错误", err.Error())
	}

	var exhibit models.Exhibit
	if err := database.DB.Preload("LastChecker").Preload("Creator").
		First(&exhibit, id).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "展品不存在", err.Error())
	}

	return utils.JSONResponse(c, fiber.StatusOK, true, "", exhibit)
}

func GetExhibitList(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	status := c.Query("status")
	category := c.Query("category")
	name := c.Query("name")
	exhibitNo := c.Query("exhibit_no")

	offset := (page - 1) * pageSize

	query := database.DB.Model(&models.Exhibit{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}
	if exhibitNo != "" {
		query = query.Where("exhibit_no LIKE ?", "%"+exhibitNo+"%")
	}

	var total int64
	query.Count(&total)

	var exhibits []models.Exhibit
	if err := query.Preload("Creator").
		Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&exhibits).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "查询失败", err.Error())
	}

	return utils.PaginatedResult(c, exhibits, page, pageSize, total)
}

func CreateTransfer(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)

	var req CreateTransferRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "参数错误", err.Error())
	}

	var exhibit models.Exhibit
	if err := database.DB.First(&exhibit, req.ExhibitID).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "展品不存在", err.Error())
	}

	transfer := models.ExhibitTransfer{
		ExhibitID:    req.ExhibitID,
		FromStatus:   exhibit.Status,
		ToStatus:     req.ToStatus,
		FromLocation: exhibit.Location,
		ToLocation:   req.ToLocation,
		Reason:       req.Reason,
		ManagerID:    claims.UserID,
		Status:       "pending",
	}

	if err := database.DB.Create(&transfer).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "创建流转失败", err.Error())
	}

	_ = utils.CreateAuditLog(
		"exhibit", "transfer_request", "transfer", &transfer.ID, transfer.TransferNo,
		claims.UserID, claims.Username, claims.Role, nil, transfer,
		c.IP(), c.Get("User-Agent"), "",
	)

	return utils.JSONResponse(c, fiber.StatusCreated, true, "流转申请创建成功", transfer)
}

func ConfirmTransfer(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID格式错误", err.Error())
	}

	tx := database.DB.Begin()

	var transfer models.ExhibitTransfer
	if err := tx.First(&transfer, id).Error; err != nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusNotFound, "流转记录不存在", err.Error())
	}

	if transfer.Status != "pending" {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusBadRequest, "该流转已处理", "")
	}

	var exhibit models.Exhibit
	if err := tx.First(&exhibit, transfer.ExhibitID).Error; err != nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusNotFound, "展品不存在", err.Error())
	}

	now := time.Now()
	transfer.Status = "confirmed"
	transfer.ConfirmedBy = &claims.UserID
	transfer.ConfirmedAt = &now

	oldStatus := exhibit.Status
	oldLocation := exhibit.Location
	exhibit.Status = transfer.ToStatus
	exhibit.Location = transfer.ToLocation
	exhibit.LastCheckedBy = &claims.UserID
	exhibit.LastCheckedAt = &now

	if err := tx.Save(&transfer).Error; err != nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusInternalServerError, "确认失败", err.Error())
	}

	if err := tx.Save(&exhibit).Error; err != nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusInternalServerError, "更新展品状态失败", err.Error())
	}

	tx.Commit()

	_ = utils.CreateAuditLog(
		"exhibit", "transfer_confirm", "transfer", &transfer.ID, transfer.TransferNo,
		claims.UserID, claims.Username, claims.Role,
		fiber.Map{"status": oldStatus, "location": oldLocation},
		fiber.Map{"status": transfer.ToStatus, "location": transfer.ToLocation},
		c.IP(), c.Get("User-Agent"), "",
	)

	return utils.JSONResponse(c, fiber.StatusOK, true, "流转确认成功", fiber.Map{
		"transfer": transfer,
		"exhibit":  exhibit,
	})
}

func GetTransferList(c *fiber.Ctx) error {
	exhibitID, _ := strconv.ParseUint(c.Query("exhibit_id"), 10, 32)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	status := c.Query("status")

	offset := (page - 1) * pageSize

	query := database.DB.Model(&models.ExhibitTransfer{})

	if exhibitID > 0 {
		query = query.Where("exhibit_id = ?", exhibitID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var transfers []models.ExhibitTransfer
	if err := query.Preload("Exhibit").Preload("Manager").Preload("Confirmer").
		Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&transfers).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "查询失败", err.Error())
	}

	return utils.PaginatedResult(c, transfers, page, pageSize, total)
}
