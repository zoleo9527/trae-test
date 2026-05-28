package handler

import (
	"camp-system/internal/auth"
	"camp-system/internal/model"
	"camp-system/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type MaterialHandler struct {
	materialService *service.MaterialService
}

func NewMaterialHandler() *MaterialHandler {
	return &MaterialHandler{
		materialService: service.NewMaterialService(),
	}
}

type RequestMaterialRequest struct {
	CamperID string `json:"camper_id" binding:"required"`
	ItemID   string `json:"item_id" binding:"required"`
	Quantity int    `json:"quantity" binding:"required,min=1"`
	Reason   string `json:"reason" binding:"required"`
	Remark   string `json:"remark"`
}

func (h *MaterialHandler) RequestMaterial(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	var req RequestMaterialRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误: " + err.Error()})
		return
	}

	issue, err := h.materialService.RequestMaterial(service.RequestMaterialRequest{
		CamperID:        req.CamperID,
		ItemID:          req.ItemID,
		RequesterID:     userCtx.UserID,
		RequesterName:   userCtx.Name,
		RequesterRole:   string(userCtx.Role),
		Quantity:        req.Quantity,
		Reason:          req.Reason,
		Remark:          req.Remark,
		IP:              c.ClientIP(),
		UserAgent:       c.Request.UserAgent(),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "物资申领提交成功",
		"data":    issue,
	})
}

type ApproveMaterialRequest struct {
	Approved       bool   `json:"approved" binding:"required"`
	ApprovalRemark string `json:"approval_remark"`
}

func (h *MaterialHandler) ApproveMaterial(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	issueID := c.Param("id")

	var req ApproveMaterialRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误: " + err.Error()})
		return
	}

	issue, err := h.materialService.ApproveMaterial(service.ApproveMaterialRequest{
		IssueID:        issueID,
		ApproverID:     userCtx.UserID,
		ApproverName:   userCtx.Name,
		ApproverRole:   string(userCtx.Role),
		Approved:       req.Approved,
		ApprovalRemark: req.ApprovalRemark,
		IP:             c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "审批完成",
		"data":    issue,
	})
}

type IssueMaterialRequest struct {
	Remark string `json:"remark"`
}

func (h *MaterialHandler) IssueMaterial(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	issueID := c.Param("id")

	var req IssueMaterialRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误: " + err.Error()})
		return
	}

	issue, err := h.materialService.IssueMaterial(service.IssueMaterialRequest{
		IssueID:    issueID,
		IssuerID:   userCtx.UserID,
		IssuerName: userCtx.Name,
		IssuerRole: string(userCtx.Role),
		Remark:     req.Remark,
		IP:         c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "物资已发放",
		"data":    issue,
	})
}

func (h *MaterialHandler) GetMaterialItems(c *gin.Context) {
	items, err := h.materialService.GetMaterialItems()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h *MaterialHandler) GetCampMaterialIssues(c *gin.Context) {
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

	issues, total, err := h.materialService.GetCampMaterialIssues(campID, model.MaterialStatus(status), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  issues,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func (h *MaterialHandler) GetLowStockItems(c *gin.Context) {
	items, err := h.materialService.GetLowStockItems()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}
