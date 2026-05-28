package handler

import (
	"camp-system/internal/auth"
	"camp-system/internal/model"
	"camp-system/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type MedicalHandler struct {
	medicalService *service.MedicalService
}

func NewMedicalHandler() *MedicalHandler {
	return &MedicalHandler{
		medicalService: service.NewMedicalService(),
	}
}

type CreateMedicalReportRequest struct {
	CamperID        string   `json:"camper_id" binding:"required"`
	Severity        string   `json:"severity" binding:"required"`
	Symptoms        string   `json:"symptoms" binding:"required"`
	Description     string   `json:"description"`
	Temperature     float64  `json:"temperature"`
	BloodPressure   string   `json:"blood_pressure"`
	Pulse           int      `json:"pulse"`
	InitialTreatment string   `json:"initial_treatment"`
	Medications     []string `json:"medications"`
	NeedFollowUp    bool     `json:"need_follow_up"`
	Remark          string   `json:"remark"`
}

func (h *MedicalHandler) CreateMedicalReport(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	var req CreateMedicalReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误: " + err.Error()})
		return
	}

	if err := h.medicalService.ValidateCamperAccess(req.CamperID, userCtx.UserID, userCtx.Role); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	report, err := h.medicalService.CreateMedicalReport(service.CreateMedicalReportRequest{
		CamperID:        req.CamperID,
		ReporterID:      userCtx.UserID,
		ReporterName:    userCtx.Name,
		ReporterRole:    string(userCtx.Role),
		Severity:        model.MedicalSeverity(req.Severity),
		Symptoms:        req.Symptoms,
		Description:     req.Description,
		Temperature:     req.Temperature,
		BloodPressure:   req.BloodPressure,
		Pulse:           req.Pulse,
		InitialTreatment: req.InitialTreatment,
		Medications:     req.Medications,
		NeedFollowUp:    req.NeedFollowUp,
		Remark:          req.Remark,
		IP:              c.ClientIP(),
		UserAgent:       c.Request.UserAgent(),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "医疗上报成功",
		"data":    report,
	})
}

type UpdateMedicalStatusRequest struct {
	Status      string   `json:"status" binding:"required"`
	Treatment   string   `json:"treatment"`
	Medications []string `json:"medications"`
	Resolution  string   `json:"resolution"`
	Remark      string   `json:"remark"`
}

func (h *MedicalHandler) UpdateMedicalStatus(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	reportID := c.Param("id")

	var req UpdateMedicalStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误: " + err.Error()})
		return
	}

	if err := h.medicalService.ValidateReportAccess(reportID, userCtx.UserID, userCtx.Role); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	report, err := h.medicalService.UpdateMedicalStatus(service.UpdateMedicalStatusRequest{
		ReportID:    reportID,
		Status:      model.MedicalStatus(req.Status),
		UserID:      userCtx.UserID,
		UserName:    userCtx.Name,
		UserRole:    string(userCtx.Role),
		Treatment:   req.Treatment,
		Medications: req.Medications,
		Resolution:  req.Resolution,
		Remark:      req.Remark,
		IP:          c.ClientIP(),
		UserAgent:   c.Request.UserAgent(),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "状态更新成功",
		"data":    report,
	})
}

type NotifyParentRequest struct {
	Method  string `json:"method" binding:"required"`
	Content string `json:"content" binding:"required"`
}

func (h *MedicalHandler) NotifyParent(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	reportID := c.Param("id")

	var req NotifyParentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误: " + err.Error()})
		return
	}

	if err := h.medicalService.ValidateReportAccess(reportID, userCtx.UserID, userCtx.Role); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	err := h.medicalService.NotifyParent(service.NotifyParentRequest{
		ReportID:  reportID,
		UserID:    userCtx.UserID,
		UserName:  userCtx.Name,
		UserRole:  string(userCtx.Role),
		Method:    req.Method,
		Content:   req.Content,
		IP:        c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "家长通知已记录"})
}

func (h *MedicalHandler) GetMedicalReport(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	reportID := c.Param("id")

	if err := h.medicalService.ValidateReportAccess(reportID, userCtx.UserID, userCtx.Role); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	report, err := h.medicalService.GetMedicalReport(reportID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": report})
}

func (h *MedicalHandler) GetCampMedicalReports(c *gin.Context) {
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

	reports, total, err := h.medicalService.GetCampMedicalReports(campID, model.MedicalStatus(status), page, pageSize, userCtx.UserID, userCtx.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  reports,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func (h *MedicalHandler) GetCamperMedicalReports(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	camperID := c.Param("camper_id")

	if err := h.medicalService.ValidateCamperAccess(camperID, userCtx.UserID, userCtx.Role); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	reports, err := h.medicalService.GetCamperMedicalReports(camperID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": reports})
}

func (h *MedicalHandler) GetMedicalStatistics(c *gin.Context) {
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

	stats, err := h.medicalService.GetMedicalStatistics(campID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}
