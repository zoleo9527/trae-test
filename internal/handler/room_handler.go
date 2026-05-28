package handler

import (
	"camp-system/internal/auth"
	"camp-system/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type RoomHandler struct {
	roomService *service.RoomService
}

func NewRoomHandler() *RoomHandler {
	return &RoomHandler{
		roomService: service.NewRoomService(),
	}
}

type AssignRoomRequest struct {
	CamperID  string `json:"camper_id" binding:"required"`
	RoomID    string `json:"room_id" binding:"required"`
	BedNumber int    `json:"bed_number" binding:"required,min=1"`
	Reason    string `json:"reason"`
	Remark    string `json:"remark"`
}

func (h *RoomHandler) AssignRoom(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	var req AssignRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误: " + err.Error()})
		return
	}

	if err := h.roomService.ValidateCamperAccess(req.CamperID, userCtx.UserID, userCtx.Role); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	err := h.roomService.AssignRoom(service.AssignRoomRequest{
		CamperID:       req.CamperID,
		RoomID:         req.RoomID,
		BedNumber:      req.BedNumber,
		AssignedBy:     userCtx.UserID,
		AssignedByName: userCtx.Name,
		AssignedByRole: string(userCtx.Role),
		Reason:         req.Reason,
		Remark:         req.Remark,
		IP:             c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "分房成功"})
}

func (h *RoomHandler) GetCampRooms(c *gin.Context) {
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

	rooms, err := h.roomService.GetCampRooms(campID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": rooms})
}

func (h *RoomHandler) GetRoomStatistics(c *gin.Context) {
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

	stats, err := h.roomService.GetRoomStatistics(campID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}

func (h *RoomHandler) GetCamperRoomChanges(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	camperID := c.Param("camper_id")

	if err := h.roomService.ValidateCamperAccess(camperID, userCtx.UserID, userCtx.Role); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	changes, err := h.roomService.GetCamperRoomChanges(camperID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": changes})
}
