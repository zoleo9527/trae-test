package handler

import (
	"camp-system/internal/auth"
	"camp-system/internal/database"
	"camp-system/internal/model"
	"camp-system/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CamperHandler struct {
	logService *service.LogService
}

func NewCamperHandler() *CamperHandler {
	return &CamperHandler{
		logService: service.NewLogService(),
	}
}

func (h *CamperHandler) GetCampers(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	campID := c.Query("camp_id")
	if campID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少camp_id参数"})
		return
	}

	if !userCtx.HasCampAccess(campID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权限访问该营地数据"})
		return
	}

	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	var campers []model.Camper
	var total int64

	query := database.DB.Model(&model.Camper{}).Where("camp_id = ?", campID)

	if userCtx.Role == model.RoleTeacher {
		query = query.Where("teacher_id = ?", userCtx.UserID)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	err := query.Preload("Room").
		Preload("Teacher").
		Order("name").
		Offset(offset).
		Limit(pageSize).
		Find(&campers).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  campers,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func (h *CamperHandler) GetCamper(c *gin.Context) {
	id := c.Param("id")

	var camper model.Camper
	err := database.DB.Preload("Room").
		Preload("Teacher").
		Preload("MedicalReports").
		Preload("CheckIns").
		Preload("MaterialIssues").
		Preload("RoomChangeLogs").
		Preload("FollowUps").
		Where("id = ?", id).
		First(&camper).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "营员不存在"})
		return
	}

	camper.Age = camper.CalculateAge()

	c.JSON(http.StatusOK, gin.H{"data": camper})
}

func (h *CamperHandler) GetCamperHistory(c *gin.Context) {
	camperID := c.Param("id")

	history, err := h.logService.GetCamperFullHistory(camperID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": history})
}
