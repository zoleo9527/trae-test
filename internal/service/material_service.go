package service

import (
	"camp-system/internal/database"
	"camp-system/internal/model"
	"errors"
	"time"

	"gorm.io/gorm"
)

type MaterialService struct {
	logService *LogService
}

func NewMaterialService() *MaterialService {
	return &MaterialService{
		logService: NewLogService(),
	}
}

type RequestMaterialRequest struct {
	CamperID      string
	ItemID        string
	RequesterID   string
	RequesterName string
	RequesterRole string
	Quantity      int
	Reason        string
	Remark        string
	IP            string
	UserAgent     string
}

func (s *MaterialService) RequestMaterial(req RequestMaterialRequest) (*model.MaterialIssue, error) {
	issue := &model.MaterialIssue{
		CamperID:    req.CamperID,
		ItemID:      req.ItemID,
		RequesterID: req.RequesterID,
		Quantity:    req.Quantity,
		Status:      model.MaterialStatusPending,
		RequestTime: time.Now(),
		Reason:      req.Reason,
		Remark:      req.Remark,
	}
	issue.CreatedBy = req.RequesterID
	issue.UpdatedBy = req.RequesterID

	err := database.DB.Create(issue).Error
	if err != nil {
		return nil, err
	}

	s.logService.LogStatusChange("material_issue", issue.ID,
		"", string(model.MaterialStatusPending), req.RequesterID, "创建物资申领")

	s.logService.LogOperation(
		req.RequesterID, req.RequesterName, req.RequesterRole,
		"material_request", "material_issue", issue.ID,
		nil, issue, req.IP, req.UserAgent,
	)

	return issue, nil
}

type ApproveMaterialRequest struct {
	IssueID       string
	ApproverID    string
	ApproverName  string
	ApproverRole  string
	Approved      bool
	ApprovalRemark string
	IP            string
	UserAgent     string
}

func (s *MaterialService) ApproveMaterial(req ApproveMaterialRequest) (*model.MaterialIssue, error) {
	var issue model.MaterialIssue
	if err := database.DB.Where("id = ?", req.IssueID).First(&issue).Error; err != nil {
		return nil, err
	}

	oldStatus := issue.Status
	now := time.Now()

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		issue.ApproverID = req.ApproverID
		issue.ApproveTime = &now
		issue.ApprovalRemark = req.ApprovalRemark
		issue.UpdatedBy = req.ApproverID

		if req.Approved {
			issue.Status = model.MaterialStatusApproved
		} else {
			issue.Status = model.MaterialStatusRejected
		}

		return tx.Save(&issue).Error
	})

	if err != nil {
		return nil, err
	}

	s.logService.LogStatusChange("material_issue", issue.ID,
		string(oldStatus), string(issue.Status), req.ApproverID, req.ApprovalRemark)

	s.logService.LogOperation(
		req.ApproverID, req.ApproverName, req.ApproverRole,
		"material_approve", "material_issue", issue.ID,
		map[string]interface{}{"status": oldStatus},
		map[string]interface{}{"status": issue.Status, "approval_remark": req.ApprovalRemark},
		req.IP, req.UserAgent,
	)

	return &issue, nil
}

type IssueMaterialRequest struct {
	IssueID      string
	IssuerID     string
	IssuerName   string
	IssuerRole   string
	Remark       string
	IP           string
	UserAgent    string
}

func (s *MaterialService) IssueMaterial(req IssueMaterialRequest) (*model.MaterialIssue, error) {
	var issue model.MaterialIssue
	if err := database.DB.Where("id = ?", req.IssueID).First(&issue).Error; err != nil {
		return nil, err
	}

	oldStatus := issue.Status
	now := time.Now()

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		issue.Status = model.MaterialStatusIssued
		issue.IssuerID = req.IssuerID
		issue.IssueTime = &now
		issue.UpdatedBy = req.IssuerID
		if req.Remark != "" {
			issue.Remark = issue.Remark + "\n" + req.Remark
		}

		var item model.MaterialItem
		if err := tx.Where("id = ?", issue.ItemID).First(&item).Error; err != nil {
			return err
		}
		item.UsedStock += issue.Quantity
		if err := tx.Save(&item).Error; err != nil {
			return err
		}

		return tx.Save(&issue).Error
	})

	if err != nil {
		return nil, err
	}

	s.logService.LogStatusChange("material_issue", issue.ID,
		string(oldStatus), string(issue.Status), req.IssuerID, req.Remark)

	s.logService.LogOperation(
		req.IssuerID, req.IssuerName, req.IssuerRole,
		"material_issue", "material_issue", issue.ID,
		map[string]interface{}{"status": oldStatus},
		map[string]interface{}{"status": issue.Status},
		req.IP, req.UserAgent,
	)

	return &issue, nil
}

func (s *MaterialService) GetMaterialItems() ([]model.MaterialItem, error) {
	var items []model.MaterialItem
	err := database.DB.Order("category, name").Find(&items).Error
	return items, err
}

func (s *MaterialService) GetCampMaterialIssues(campID string, status model.MaterialStatus, page, pageSize int) ([]model.MaterialIssue, int64, error) {
	var issues []model.MaterialIssue
	var total int64

	query := database.DB.Model(&model.MaterialIssue{}).
		Joins("JOIN campers ON campers.id = material_issues.camper_id").
		Where("campers.camp_id = ?", campID)

	if status != "" {
		query = query.Where("material_issues.status = ?", status)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	err := query.Preload("Camper").
		Preload("Item").
		Preload("Requester").
		Preload("Approver").
		Preload("Issuer").
		Order("request_time DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&issues).Error

	return issues, total, err
}

func (s *MaterialService) ValidateCamperAccess(camperID string, userID string, userRole model.Role) error {
	var camper model.Camper
	if err := database.DB.Where("id = ?", camperID).First(&camper).Error; err != nil {
		return errors.New("营员不存在: " + camperID)
	}

	var user model.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		return errors.New("用户不存在")
	}

	hasCampAccess := false
	if user.Role == model.RoleAdmin || user.Role == model.RoleDirector {
		hasCampAccess = true
	} else {
		for _, cid := range user.CampIDs {
			if cid == camper.CampID {
				hasCampAccess = true
				break
			}
		}
	}
	if !hasCampAccess {
		return errors.New("无权限访问该营地数据")
	}

	if userRole == model.RoleTeacher && camper.TeacherID != userID {
		return errors.New("无权限处理非本班营员: " + camper.Name)
	}
	return nil
}

func (s *MaterialService) ValidateIssueAccess(issueID string, userID string, userRole model.Role) error {
	var issue model.MaterialIssue
	if err := database.DB.Where("id = ?", issueID).First(&issue).Error; err != nil {
		return errors.New("物资申领单不存在: " + issueID)
	}

	return s.ValidateCamperAccess(issue.CamperID, userID, userRole)
}

func (s *MaterialService) GetLowStockItems() ([]model.MaterialItem, error) {
	var items []model.MaterialItem
	err := database.DB.Where("(total_stock - used_stock) <= warning_line").
		Order("category, name").Find(&items).Error
	return items, err
}
