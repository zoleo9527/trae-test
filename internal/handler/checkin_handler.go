package handler

import (
	"camp-system/internal/auth"
	"camp-system/internal/model"
	"camp-system/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CheckInHandler struct {
	checkInService *service.CheckInService
}

func NewCheckInHandler() *CheckInHandler {
	return &CheckInHandler{
		checkInService: service.NewCheckInService(),
	}
}

type BatchCheckInRequest struct {
	ActivityID  string   `json:"activity_id" binding:"required"`
	CamperIDs   []string `json:"camper_ids" binding:"required"`
	Status      string   `json:"status"`
	Temperature float64  `json:"temperature"`
	HasSymptoms  bool     `json:"has_symptoms"`
	Symptoms    string   `json:"symptoms"`
	Remark      string   `json:"remark"`
}

func (h *CheckInHandler) BatchCheckIn(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	var req BatchCheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误: " + err.Error()})
		return
	}

	status := model.CheckInStatus(req.Status)
	if status == "" {
		status = model.CheckInStatusPresent
	}

	result, err := h.checkInService.BatchCheckIn(service.BatchCheckInRequest{
		ActivityID:    req.ActivityID,
		CamperIDs:     req.CamperIDs,
		Status:        status,
		CheckedBy:     userCtx.UserID,
		CheckedByName: userCtx.Name,
		CheckedByRole: string(userCtx.Role),
		Temperature:   req.Temperature,
		HasSymptoms:   req.HasSymptoms,
		Symptoms:      req.Symptoms,
		Remark:        req.Remark,
		IP:            c.ClientIP(),
		UserAgent:     c.Request.UserAgent(),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "签到成功",
		"data":    result,
		"count":   len(result),
	})
}

func (h *CheckInHandler) GetActivityCheckIns(c *gin.Context) {
	activityID := c.Param("activity_id")
	if activityID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少活动ID"})
		return
	}

	checkIns, err := h.checkInService.GetActivityCheckIns(activityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": checkIns})
}

func (h *CheckInHandler) GetCheckInStatistics(c *gin.Context) {
	activityID := c.Param("activity_id")
	if activityID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少活动ID"})
		return
	}

	stats, err := h.checkInService.GetCheckInStatistics(activityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}

func (h *CheckInHandler) GetCamperCheckIns(c *gin.Context) {
	camperID := c.Param("camper_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	checkIns, total, err := h.checkInService.GetCamperCheckIns(camperID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  checkIns,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}
