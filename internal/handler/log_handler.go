package handler

import (
	"camp-system/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type LogHandler struct {
	logService *service.LogService
}

func NewLogHandler() *LogHandler {
	return &LogHandler{
		logService: service.NewLogService(),
	}
}

func (h *LogHandler) GetOperationLogs(c *gin.Context) {
	entityType := c.Query("entity_type")
	entityID := c.Query("entity_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))

	logs, total, err := h.logService.GetOperationLogs(entityType, entityID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  logs,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func (h *LogHandler) GetEntityStatusHistory(c *gin.Context) {
	entityType := c.Param("entity_type")
	entityID := c.Param("entity_id")

	history, err := h.logService.GetEntityHistory(entityType, entityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": history})
}
