package handler

import (
	"camp-system/internal/auth"
	"camp-system/internal/model"
	"camp-system/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	dashboardService *service.DashboardService
}

func NewDashboardHandler() *DashboardHandler {
	return &DashboardHandler{
		dashboardService: service.NewDashboardService(),
	}
}

func (h *DashboardHandler) GetDashboard(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	campID := c.Query("camp_id")
	if campID == "" && len(userCtx.CampIDs) > 0 {
		campID = userCtx.CampIDs[0]
	}

	if campID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少营地ID"})
		return
	}

	if !userCtx.HasCampAccess(campID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权限访问该营地数据"})
		return
	}

	var data interface{}
	var err error

	switch userCtx.Role {
	case model.RoleDirector:
		data, err = h.dashboardService.GetDirectorDashboard(campID)
	case model.RoleTeacher:
		data, err = h.dashboardService.GetTeacherDashboard(campID, userCtx.UserID)
	case model.RoleLogistics:
		data, err = h.dashboardService.GetLogisticsDashboard(campID)
	case model.RoleMedical:
		data, err = h.dashboardService.GetMedicalDashboard(campID, userCtx.UserID)
	default:
		data, err = h.dashboardService.GetDirectorDashboard(campID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"role": userCtx.Role,
		"data": data,
	})
}
