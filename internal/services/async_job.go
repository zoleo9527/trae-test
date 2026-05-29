package services

import (
	"encoding/json"
	"exhibition-system/internal/database"
	"exhibition-system/internal/models"
	"fmt"
	"time"
)

type AsyncJobService struct {
	auditService *AuditService
}

func NewAsyncJobService() *AsyncJobService {
	return &AsyncJobService{
		auditService: NewAuditService(),
	}
}

func (s *AsyncJobService) CreateJob(jobType string, payload map[string]interface{}, operatorID uint) (*models.AsyncJob, error) {
	job := &models.AsyncJob{
		Type:       jobType,
		Status:     "pending",
		Priority:   1,
		Payload:    payload,
		OperatorID: operatorID,
	}
	if err := database.DB.Create(job).Error; err != nil {
		return nil, err
	}
	return job, nil
}

func (s *AsyncJobService) ProcessJob(job *models.AsyncJob) error {
	now := time.Now()
	job.Status = "running"
	job.StartedAt = &now
	database.DB.Save(job)

	var err error
	switch job.Type {
	case "certificate_batch_approve":
		err = s.processCertificateBatchApprove(job)
	case "inspection_to_teardown":
		err = s.processInspectionToTeardown(job)
	case "teardown_complete":
		err = s.processTeardownComplete(job)
	default:
		err = fmt.Errorf("unknown job type: %s", job.Type)
	}

	finishedAt := time.Now()
	job.FinishedAt = &finishedAt

	if err != nil {
		job.Status = "failed"
		job.Error = err.Error()
		job.Retries++
	} else {
		job.Status = "completed"
	}

	return database.DB.Save(job).Error
}

func (s *AsyncJobService) processCertificateBatchApprove(job *models.AsyncJob) error {
	idsRaw, ok := job.Payload["ids"]
	if !ok {
		return fmt.Errorf("missing ids in payload")
	}

	jsonBytes, _ := json.Marshal(idsRaw)
	var ids []uint
	if err := json.Unmarshal(jsonBytes, &ids); err != nil {
		return fmt.Errorf("invalid ids format: %w", err)
	}

	now := time.Now()
	userID := job.OperatorID

	var certs []models.Certificate
	if err := database.DB.Where("id IN ? AND status IN ?", ids, []string{string(models.StatusPending), string(models.StatusReviewing)}).Find(&certs).Error; err != nil {
		return err
	}

	tx := database.DB.Begin()

	for _, cert := range certs {
		oldCert := cert
		cert.Status = models.StatusApproved
		cert.Resubmitted = false
		cert.RejectReason = ""
		cert.ApprovedByID = &userID
		cert.ApprovedAt = &now

		if err := tx.Save(&cert).Error; err != nil {
			tx.Rollback()
			return err
		}

		s.auditService.Log(
			userID,
			models.ActionApprove,
			models.ResourceCertificate,
			cert.ID,
			&cert.ProjectID,
			&oldCert,
			&cert,
			"Batch approved certificate: "+cert.Name,
			"",
			"",
		)
	}

	result := tx.Model(&models.Certificate{}).
		Where("id IN ? AND status IN ?", ids, []string{string(models.StatusPending), string(models.StatusReviewing)}).
		Updates(map[string]interface{}{
			"status":         models.StatusApproved,
			"resubmitted":    false,
			"reject_reason":  "",
			"approved_by_id": userID,
			"approved_at":    now,
		})

	if result.Error != nil {
		tx.Rollback()
		return result.Error
	}

	tx.Commit()

	job.Result = map[string]interface{}{
		"processed_count": len(certs),
		"total_requested": len(ids),
	}

	return nil
}

func (s *AsyncJobService) processInspectionToTeardown(job *models.AsyncJob) error {
	projectIDRaw, ok := job.Payload["project_id"]
	if !ok {
		return fmt.Errorf("missing project_id in payload")
	}

	jsonBytes, _ := json.Marshal(projectIDRaw)
	var projectID uint
	if err := json.Unmarshal(jsonBytes, &projectID); err != nil {
		return fmt.Errorf("invalid project_id format: %w", err)
	}

	userID := job.OperatorID

	var project models.Project
	if err := database.DB.First(&project, projectID).Error; err != nil {
		return fmt.Errorf("project not found: %w", err)
	}

	if project.Phase != models.PhaseInspection && project.Phase != models.PhaseExhibition {
		return fmt.Errorf("project is not in inspection or exhibition phase, current phase: %s", project.Phase)
	}

	oldPhase := project.Phase
	project.Phase = models.PhaseTeardown
	if err := database.DB.Save(&project).Error; err != nil {
		return err
	}

	s.auditService.Log(
		userID,
		models.ActionPhase,
		models.ResourceProject,
		project.ID,
		&project.ID,
		nil,
		nil,
		fmt.Sprintf("Auto phase transition: %s -> teardown (inspection approved, teardown flow triggered)", oldPhase),
		"",
		"",
	)

	var approvedInspections []models.Inspection
	database.DB.Where("project_id = ? AND status = ?", projectID, models.StatusApproved).Find(&approvedInspections)

	for _, insp := range approvedInspections {
		var items []models.InspectionItem
		database.DB.Where("inspection_id = ?", insp.ID).Find(&items)

		var failedItems []models.InspectionItem
		for _, item := range items {
			if item.Passed != nil && !*item.Passed {
				failedItems = append(failedItems, item)
			}
		}

		teardown := &models.TeardownReview{
			ProjectID: projectID,
			Title:     fmt.Sprintf("撤场复盘 - %s", insp.Title),
			Status:    models.StatusPending,
			Summary:   fmt.Sprintf("来自验收单[%s]的撤场复盘", insp.Title),
		}
		teardown.OperatorID = insp.InspectorID

		if len(failedItems) > 0 {
			teardown.Summary = fmt.Sprintf("从验收单[%s]自动生成的撤场跟进，共%d项未通过", insp.Title, len(failedItems))
		} else {
			teardown.Summary = fmt.Sprintf("验收单[%s]全部通过，进入撤场复盘", insp.Title)
		}

		tx := database.DB.Begin()
		if err := tx.Create(teardown).Error; err != nil {
			tx.Rollback()
			continue
		}

		for _, fi := range failedItems {
			severity := models.SeverityMinor
			issue := models.TeardownIssue{
				TeardownReviewID: teardown.ID,
				Title:            fi.Name,
				Description:      fi.Remarks,
				Severity:         severity,
				Category:         string(insp.Type),
				Status:           models.TaskStatusTodo,
			}
			if err := tx.Create(&issue).Error; err != nil {
				tx.Rollback()
				continue
			}
		}

		tx.Commit()

		s.auditService.Log(
			userID,
			models.ActionCreate,
			models.ResourceTeardown,
			teardown.ID,
			&projectID,
			nil,
			teardown,
			fmt.Sprintf("Auto-created teardown review from inspection: %s", insp.Title),
			"",
			"",
		)
	}

	job.Result = map[string]interface{}{
		"project_id":            projectID,
		"previous_phase":        oldPhase,
		"current_phase":         models.PhaseTeardown,
		"inspections_processed": len(approvedInspections),
	}

	return nil
}

func (s *AsyncJobService) ProcessPendingJobs() error {
	var jobs []models.AsyncJob
	err := database.DB.Where("status IN ? AND retries < ?", []string{"pending", "failed"}, 3).
		Order("priority DESC, created_at ASC").
		Limit(10).
		Find(&jobs).Error
	if err != nil {
		return err
	}

	for _, job := range jobs {
		if err := s.ProcessJob(&job); err != nil {
			continue
		}
	}

	return nil
}

func (s *AsyncJobService) processTeardownComplete(job *models.AsyncJob) error {
	projectIDRaw, ok := job.Payload["project_id"]
	if !ok {
		return fmt.Errorf("missing project_id in payload")
	}

	jsonBytes, _ := json.Marshal(projectIDRaw)
	var projectID uint
	if err := json.Unmarshal(jsonBytes, &projectID); err != nil {
		return fmt.Errorf("invalid project_id format: %w", err)
	}

	userID := job.OperatorID

	var project models.Project
	if err := database.DB.First(&project, projectID).Error; err != nil {
		return fmt.Errorf("project not found: %w", err)
	}

	if project.Phase != models.PhaseTeardown && project.Phase != models.PhaseReview {
		return fmt.Errorf("project is not in teardown or review phase, current phase: %s", project.Phase)
	}

	oldPhase := project.Phase
	project.Phase = models.PhaseCompleted
	project.Status = models.StatusCompleted
	if err := database.DB.Save(&project).Error; err != nil {
		return err
	}

	s.auditService.Log(
		userID,
		models.ActionPhase,
		models.ResourceProject,
		project.ID,
		&project.ID,
		nil,
		nil,
		fmt.Sprintf("Auto phase transition: %s -> completed (all teardown reviews approved)", oldPhase),
		"",
		"",
	)

	var openIssues []models.TeardownIssue
	database.DB.Joins("JOIN teardown_reviews ON teardown_reviews.id = teardown_issues.teardown_review_id").
		Where("teardown_reviews.project_id = ? AND teardown_issues.status NOT IN ?", projectID, []string{string(models.TaskStatusDone), string(models.TaskStatusRejected)}).
		Find(&openIssues)

	if len(openIssues) > 0 {
		for _, issue := range openIssues {
			s.auditService.Log(
				userID,
				models.ActionStatus,
				models.ResourceTeardown,
				issue.TeardownReviewID,
				&projectID,
				nil,
				nil,
				fmt.Sprintf("Open issue flagged at project completion: %s (severity: %s)", issue.Title, issue.Severity),
				"",
				"",
			)
		}
	}

	job.Result = map[string]interface{}{
		"project_id":     projectID,
		"previous_phase": oldPhase,
		"current_phase":  models.PhaseCompleted,
		"open_issues":    len(openIssues),
	}

	return nil
}
