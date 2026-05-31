package service

import (
	"fmt"
	"time"

	"floor-settlement/internal/dto"
	"floor-settlement/internal/model"
	"floor-settlement/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type SettlementService struct {
	settlementRepo  *repository.SettlementRepository
	attendanceRepo  *repository.AttendanceRepository
	teamRepo        *repository.TeamRepository
	reworkRepo      *repository.ReworkRepository
	deliveryRepo    *repository.DeliveryRepository
	changeOrderRepo *repository.ChangeOrderRepository
	qualityRepo     *repository.QualityRepository
	auditTrailRepo  *repository.AuditTrailRepository
}

func NewSettlementService() *SettlementService {
	return &SettlementService{
		settlementRepo:  &repository.SettlementRepository{},
		attendanceRepo:  &repository.AttendanceRepository{},
		teamRepo:        &repository.TeamRepository{},
		reworkRepo:      &repository.ReworkRepository{},
		deliveryRepo:    &repository.DeliveryRepository{},
		changeOrderRepo: &repository.ChangeOrderRepository{},
		qualityRepo:     &repository.QualityRepository{},
		auditTrailRepo:  &repository.AuditTrailRepository{},
	}
}

func getPriceByTradeType(tradeType string) float64 {
	switch tradeType {
	case "环氧地坪":
		return 350
	case "耐磨地坪":
		return 280
	case "固化剂地坪":
		return 220
	case "普通地坪":
		return 200
	default:
		return 250
	}
}

func (s *SettlementService) GenerateFromAttendance(operator *OperatorInfo, req *dto.GenerateSettlementRequest) (*model.SettlementBatch, error) {
	teamID, err := uuid.Parse(req.TeamID)
	if err != nil {
		return nil, err
	}
	projectID, err := uuid.Parse(req.ProjectID)
	if err != nil {
		return nil, err
	}
	periodStart, err := time.Parse("2006-01-02", req.PeriodStart)
	if err != nil {
		return nil, err
	}
	periodEnd, err := time.Parse("2006-01-02", req.PeriodEnd)
	if err != nil {
		return nil, err
	}

	team, err := s.teamRepo.FindByID(teamID)
	if err != nil {
		return nil, err
	}

	attendanceRecords, err := s.attendanceRepo.FindByTeamAndDateRange(teamID, periodStart, periodEnd)
	if err != nil {
		return nil, err
	}

	unitPrice := getPriceByTradeType(team.TradeType)
	var items []model.SettlementItem
	var totalAmount float64

	for _, record := range attendanceRecords {
		if record.Status == "absent" {
			continue
		}
		quantity := record.HoursWorked / 8.0
		dailyAmount := quantity * unitPrice

		item := model.SettlementItem{
			AttendanceRecordID: &record.ID,
			WorkerName:         record.WorkerName,
			RecordDate:         record.RecordDate,
			WorkArea:           record.WorkArea,
			WorkContent:        record.TaskDescription,
			Quantity:           quantity,
			Unit:               "工日",
			UnitPrice:          unitPrice,
			DailyAmount:        dailyAmount,
		}
		items = append(items, item)
		totalAmount += dailyAmount
	}

	reworkRecords, err := s.reworkRepo.FindUnsettledCompletedByTeamAndDateRange(teamID, periodStart, periodEnd)
	if err != nil {
		return nil, err
	}

	var reworkDeductions []map[string]interface{}
	var totalReworkDeduction float64

	for _, rework := range reworkRecords {
		recordDate := rework.CreatedAt
		if rework.CompletedAt != nil {
			recordDate = *rework.CompletedAt
		}

		item := model.SettlementItem{
			WorkerName:  rework.ResponsiblePerson,
			RecordDate:  recordDate,
			WorkContent: fmt.Sprintf("返工扣款: %s - %s", rework.Reason, rework.Description),
			Quantity:    1,
			Unit:        "项",
			UnitPrice:   -rework.Cost,
			DailyAmount: -rework.Cost,
		}
		items = append(items, item)
		totalAmount -= rework.Cost
		totalReworkDeduction += rework.Cost

		reworkDeductions = append(reworkDeductions, map[string]interface{}{
			"rework_id":  rework.ID,
			"reason":     rework.Reason,
			"cost":       rework.Cost,
			"responsible": rework.ResponsiblePerson,
		})
	}

	deliveryIssues, err := s.deliveryRepo.FindUnconfirmedByTeamAndDateRange(teamID, periodStart, periodEnd)
	if err != nil {
		return nil, err
	}

	remarkParts := []string{}
	if req.Remark != "" {
		remarkParts = append(remarkParts, req.Remark)
	}

	if len(reworkDeductions) > 0 {
		remarkParts = append(remarkParts, fmt.Sprintf("返工扣款%d笔，共扣¥%.2f", len(reworkDeductions), totalReworkDeduction))
		for _, d := range reworkDeductions {
			remarkParts = append(remarkParts, fmt.Sprintf("- %s: ¥%.2f (%s)", d["reason"], d["cost"], d["responsible"]))
		}
	}

	if len(deliveryIssues) > 0 {
		pendingCount := 0
		partialCount := 0
		for _, d := range deliveryIssues {
			if d.ReceiptStatus == "pending" {
				pendingCount++
			} else if d.ReceiptStatus == "partial" {
				partialCount++
			}
		}
		remarkParts = append(remarkParts, fmt.Sprintf("发货异常%d单：待确认%d单，短缺%d单", len(deliveryIssues), pendingCount, partialCount))
		for _, d := range deliveryIssues {
			statusLabel := "待确认"
			if d.ReceiptStatus == "partial" {
				statusLabel = "短缺"
			}
			remarkParts = append(remarkParts, fmt.Sprintf("- %s: %s (数量%.2f%s)", statusLabel, d.MaterialName, d.Quantity, d.Unit))
		}
	}

	finalRemark := ""
	for i, p := range remarkParts {
		if i > 0 {
			finalRemark += "; "
		}
		finalRemark += p
	}

	batch := &model.SettlementBatch{
		TeamID:      teamID,
		ProjectID:   projectID,
		PeriodStart: periodStart,
		PeriodEnd:   periodEnd,
		TotalAmount: totalAmount,
		Status:      "draft",
		Remark:      finalRemark,
	}

	if len(deliveryIssues) > 0 || len(reworkDeductions) > 0 {
		batch.Status = "disputed"
	}

	if err := s.settlementRepo.Create(batch); err != nil {
		return nil, err
	}

	for i := range items {
		items[i].SettlementBatchID = batch.ID
	}

	if len(items) > 0 {
		if err := s.settlementRepo.CreateItems(items); err != nil {
			return nil, err
		}
	}

	for _, rework := range reworkRecords {
		rework.SettlementBatchID = &batch.ID
		s.reworkRepo.Update(&rework)
	}

	batch.Items = items

	auditRemark := ""
	if len(reworkDeductions) > 0 {
		auditRemark += fmt.Sprintf("返工扣款%d笔(¥%.2f); ", len(reworkDeductions), totalReworkDeduction)
	}
	if len(deliveryIssues) > 0 {
		auditRemark += fmt.Sprintf("发货异常%d单待处理", len(deliveryIssues))
	}

	RecordAuditWithOperator(operator, "settlement_batch", batch.ID, "create", nil, toMap(batch), auditRemark)

	if len(reworkDeductions) > 0 {
		for _, d := range reworkDeductions {
			RecordAuditWithOperator(operator, "settlement_batch", batch.ID, "rework_deduction", nil,
				map[string]interface{}{
					"rework_id":   d["rework_id"],
					"reason":      d["reason"],
					"cost":        d["cost"],
					"responsible": d["responsible"],
				}, "")
		}
	}

	if len(deliveryIssues) > 0 {
		for _, d := range deliveryIssues {
			RecordAuditWithOperator(operator, "settlement_batch", batch.ID, "delivery_issue", nil,
				map[string]interface{}{
					"delivery_id":     d.ID,
					"material_name":   d.MaterialName,
					"quantity":        d.Quantity,
					"unit":            d.Unit,
					"receipt_status":  d.ReceiptStatus,
				}, "")
		}
	}

	return s.settlementRepo.FindByID(batch.ID)
}

func (s *SettlementService) FindByID(id uuid.UUID) (*model.SettlementBatch, error) {
	return s.settlementRepo.FindByID(id)
}

func (s *SettlementService) Filter(ctx *fiber.Ctx, filter *dto.SettlementFilter) ([]model.SettlementBatch, int64, error) {
	claims := getUserClaims(ctx)

	var projectID uuid.UUID
	var teamID uuid.UUID

	if filter.ProjectID != "" {
		projectID, _ = uuid.Parse(filter.ProjectID)
	}
	if filter.TeamID != "" {
		teamID, _ = uuid.Parse(filter.TeamID)
	}

	if claims != nil {
		switch claims.Role {
		case "team_leader":
			if claims.TeamID != nil {
				teamID = *claims.TeamID
			}
		case "project_manager":
			if claims.ProjectID != nil {
				projectID = *claims.ProjectID
			}
		}
	}

	return s.settlementRepo.Filter(projectID, teamID, filter.Status, filter.StartDate, filter.EndDate, filter.Page, filter.PageSize)
}

func (s *SettlementService) TransitionStatus(ctx *fiber.Ctx, id uuid.UUID, req *dto.SettlementStatusAction) (*model.SettlementBatch, error) {
	batch, err := s.settlementRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	claims := getUserClaims(ctx)
	beforeStatus := batch.Status

	switch {
	case batch.Status == "draft" && req.Action == "submit":
		batch.Status = "submitted"
		batch.SubmittedBy = &claims.ID
		now := time.Now()
		batch.SubmittedAt = &now

	case batch.Status == "submitted" && req.Action == "verify":
		if claims.Role != "quality_engineer" && claims.Role != "admin" {
			return nil, fmt.Errorf("only quality_engineer or admin can verify")
		}
		batch.Status = "verified"
		batch.VerifiedBy = &claims.ID
		now := time.Now()
		batch.VerifiedAt = &now

	case batch.Status == "verified" && req.Action == "approve":
		if claims.Role != "project_manager" && claims.Role != "admin" {
			return nil, fmt.Errorf("only project_manager or admin can approve")
		}
		batch.Status = "approved"
		batch.ApprovedBy = &claims.ID
		now := time.Now()
		batch.ApprovedAt = &now

	case batch.Status == "approved" && req.Action == "pay":
		if claims.Role != "admin" {
			return nil, fmt.Errorf("only admin can mark as paid")
		}
		batch.Status = "paid"
		now := time.Now()
		batch.PaidAt = &now

	case (batch.Status == "submitted" || batch.Status == "verified" || batch.Status == "approved") && req.Action == "dispute":
		if req.Remark == "" {
			return nil, fmt.Errorf("remark is required for dispute")
		}
		batch.Status = "disputed"

	default:
		return nil, fmt.Errorf("invalid status transition from %s with action %s", batch.Status, req.Action)
	}

	if err := s.settlementRepo.Update(batch); err != nil {
		return nil, err
	}

	RecordAudit(ctx, "settlement_batch", id, req.Action,
		map[string]interface{}{"status": beforeStatus},
		map[string]interface{}{"status": batch.Status},
		req.Remark)

	return batch, nil
}

func (s *SettlementService) GetDashboardStats(projectID uuid.UUID) (*dto.DashboardStats, error) {
	teams, err := s.teamRepo.ListByProject(projectID)
	if err != nil {
		return nil, err
	}

	totalAttendance, err := s.attendanceRepo.CountByProject(projectID)
	if err != nil {
		return nil, err
	}

	pendingSettlements, err := s.settlementRepo.CountByStatus(projectID, "draft")
	if err != nil {
		return nil, err
	}

	pendingDeliveries, err := s.deliveryRepo.CountByStatus(projectID, "pending")
	if err != nil {
		return nil, err
	}

	pendingChangeOrders, err := s.changeOrderRepo.CountByStatus(projectID, "pending")
	if err != nil {
		return nil, err
	}

	openReworks, err := s.reworkRepo.CountByStatus(projectID, "pending")
	if err != nil {
		return nil, err
	}

	totalInspections, err := s.qualityRepo.CountByProject(projectID)
	if err != nil {
		return nil, err
	}

	passInspections, err := s.qualityRepo.CountByResult(projectID, "pass")
	if err != nil {
		return nil, err
	}

	var qualityPassRate float64
	if totalInspections > 0 {
		qualityPassRate = float64(passInspections) / float64(totalInspections) * 100
	}

	totalSettlementAmount, err := s.settlementRepo.SumAmountByProject(projectID)
	if err != nil {
		return nil, err
	}

	recentTrails, err := s.auditTrailRepo.RecentByProject(projectID, 10)
	if err != nil {
		return nil, err
	}

	var auditSummaries []dto.AuditSummary
	for _, t := range recentTrails {
		auditSummaries = append(auditSummaries, dto.AuditSummary{
			EntityType:   t.EntityType,
			EntityID:     t.EntityID,
			Action:       t.Action,
			OperatorName: t.OperatorName,
			CreatedAt:    t.CreatedAt,
		})
	}

	return &dto.DashboardStats{
		ProjectID:             projectID,
		TotalTeams:            int64(len(teams)),
		TotalAttendance:       totalAttendance,
		PendingSettlements:    pendingSettlements,
		PendingDeliveries:     pendingDeliveries,
		PendingChangeOrders:   pendingChangeOrders,
		OpenReworks:           openReworks,
		QualityPassRate:       qualityPassRate,
		TotalSettlementAmount: totalSettlementAmount,
		RecentAuditTrails:     auditSummaries,
	}, nil
}
