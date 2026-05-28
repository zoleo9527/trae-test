package handler

import (
	"camp-system/internal/auth"
	"camp-system/internal/model"
	"camp-system/internal/service"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type FollowUpHandler struct {
	followUpService *service.FollowUpService
}

func NewFollowUpHandler() *FollowUpHandler {
	return &FollowUpHandler{
		followUpService: service.NewFollowUpService(),
	}
}

type CreateFollowUpRequest struct {
	CamperID         string    `json:"camper_id" binding:"required"`
	Type             string    `json:"type" binding:"required"`
	Priority         string    `json:"priority" binding:"required"`
	Title            string    `json:"title" binding:"required"`
	Description      string    `json:"description"`
	RelatedMedicalID string    `json:"related_medical_id"`
	RelatedCheckInID string    `json:"related_check_in_id"`
	AssignedTo       string    `json:"assigned_to" binding:"required"`
	ScheduledTime    time.Time `json:"scheduled_time"`
	DueTime          time.Time `json:"due_time"`
	Remark           string    `json:"remark"`
}

func (h *FollowUpHandler) CreateFollowUp(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	var req CreateFollowUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误: " + err.Error()})
		return
	}

	var scheduledTime, dueTime *time.Time
	if !req.ScheduledTime.IsZero() {
		scheduledTime = &req.ScheduledTime
	}
	if !req.DueTime.IsZero() {
		dueTime = &req.DueTime
	}

	followUp, err := h.followUpService.CreateFollowUp(service.CreateFollowUpRequest{
		CamperID:         req.CamperID,
		Type:             model.FollowUpType(req.Type),
		Priority:         model.FollowUpPriority(req.Priority),
		Title:            req.Title,
		Description:      req.Description,
		RelatedMedicalID: req.RelatedMedicalID,
		RelatedCheckInID: req.RelatedCheckInID,
		AssignedTo:       req.AssignedTo,
		ScheduledTime:    scheduledTime,
		DueTime:          dueTime,
		CreatedBy:        userCtx.UserID,
		CreatedByName:    userCtx.Name,
		CreatedByRole:    string(userCtx.Role),
		Remark:           req.Remark,
		IP:               c.ClientIP(),
		UserAgent:        c.Request.UserAgent(),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "随访任务创建成功",
		"data":    followUp,
	})
}

type UpdateFollowUpStatusRequest struct {
	Status   string `json:"status" binding:"required"`
	Result   string `json:"result"`
	NextStep string `json:"next_step"`
	Remark   string `json:"remark"`
}

func (h *FollowUpHandler) UpdateFollowUpStatus(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	followUpID := c.Param("id")

	var req UpdateFollowUpStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误: " + err.Error()})
		return
	}

	followUp, err := h.followUpService.UpdateFollowUpStatus(service.UpdateFollowUpStatusRequest{
		FollowUpID: followUpID,
		Status:     model.FollowUpStatus(req.Status),
		UserID:     userCtx.UserID,
		UserName:   userCtx.Name,
		UserRole:   string(userCtx.Role),
		Result:     req.Result,
		NextStep:   req.NextStep,
		Remark:     req.Remark,
		IP:         c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "状态更新成功",
		"data":    followUp,
	})
}

func (h *FollowUpHandler) GetCampFollowUps(c *gin.Context) {
	campID := c.Query("camp_id")
	if campID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少camp_id参数"})
		return
	}

	userCtx := auth.GetCurrentUser(c)
	if userCtx != nil && !userCtx.HasCampAccess(campID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权限访问该营地数据"})
		return
	}

	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	followUps, total, err := h.followUpService.GetCampFollowUps(campID, model.FollowUpStatus(status), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  followUps,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func (h *FollowUpHandler) GetMyFollowUps(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	status := c.Query("status")

	followUps, err := h.followUpService.GetUserAssignedFollowUps(userCtx.UserID, model.FollowUpStatus(status))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": followUps})
}

func (h *FollowUpHandler) GetOverdueFollowUps(c *gin.Context) {
	campID := c.Query("camp_id")
	if campID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少camp_id参数"})
		return
	}

	userCtx := auth.GetCurrentUser(c)
	if userCtx != nil && !userCtx.HasCampAccess(campID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权限访问该营地数据"})
		return
	}

	followUps, err := h.followUpService.GetOverdueFollowUps(campID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": followUps})
}

func (h *FollowUpHandler) GetCamperFollowUps(c *gin.Context) {
	camperID := c.Param("camper_id")

	followUps, err := h.followUpService.GetCamperFollowUps(camperID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": followUps})
}
