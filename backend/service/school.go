package service

import (
	"instrument-rental/database"
	"instrument-rental/model"

	"gorm.io/gorm"
)

type SchoolService struct{}

func NewSchoolService() *SchoolService { return &SchoolService{} }

type CreateSchoolInput struct {
	Name              string `json:"name"`
	ContactPerson     string `json:"contact_person"`
	ContactPhone      string `json:"contact_phone"`
	Address           string `json:"address"`
	CooperationStatus string `json:"cooperation_status"`
	ContractStart     string `json:"contract_start"`
	ContractEnd       string `json:"contract_end"`
	Notes             string `json:"notes"`
}

func (s *SchoolService) List(status, keyword string, page, pageSize int) ([]model.School, int64, error) {
	var schools []model.School
	var total int64
	q := database.DB.Model(&model.School{})
	if status != "" {
		q = q.Where("cooperation_status = ?", status)
	}
	if keyword != "" {
		like := "%" + keyword + "%"
		q = q.Where("name LIKE ? OR contact_person LIKE ?", like, like)
	}
	q.Count(&total)
	offset := (page - 1) * pageSize
	err := q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&schools).Error
	return schools, total, err
}

func (s *SchoolService) GetByID(id uint) (*model.School, error) {
	var school model.School
	err := database.DB.First(&school, id).Error
	return &school, err
}

func (s *SchoolService) Create(input *CreateSchoolInput, userID uint, ip string) (*model.School, error) {
	school := &model.School{
		Name:             input.Name,
		ContactPerson:    input.ContactPerson,
		ContactPhone:     input.ContactPhone,
		Address:          input.Address,
		CooperationStatus: model.SchoolStatus(input.CooperationStatus),
		Notes:            input.Notes,
	}
	if input.ContractStart != "" {
		if t, err := parseDate(input.ContractStart); err == nil {
			school.ContractStart = &t
		}
	}
	if input.ContractEnd != "" {
		if t, err := parseDate(input.ContractEnd); err == nil {
			school.ContractEnd = &t
		}
	}
	if err := database.DB.Create(school).Error; err != nil {
		return nil, err
	}
	newVal := schoolToMap(school)
	logEntry := model.AuditLog{
		UserID:     userID,
		Action:     "create",
		EntityType: "school",
		EntityID:   school.ID,
		NewValue:   newVal,
		IPAddress:  ip,
	}
	database.DB.Create(&logEntry)
	return school, nil
}

func (s *SchoolService) Update(id uint, updates map[string]any, userID uint, ip string) error {
	oldVal := fetchOldSchool(id)
	err := database.DB.Model(&model.School{}).Where("id = ?", id).Updates(updates).Error
	if err == nil {
		newVal := fetchOldSchool(id)
		logEntry := model.AuditLog{
			UserID:     userID,
			Action:     "update",
			EntityType: "school",
			EntityID:   id,
			OldValue:   oldVal,
			NewValue:   newVal,
			IPAddress:  ip,
		}
		database.DB.Create(&logEntry)
	}
	return err
}

func (s *SchoolService) Delete(id uint, userID uint, ip string) error {
	oldVal := fetchOldSchool(id)
	err := database.DB.Delete(&model.School{}, id).Error
	if err == nil {
		logEntry := model.AuditLog{
			UserID:     userID,
			Action:     "delete",
			EntityType: "school",
			EntityID:   id,
			OldValue:   oldVal,
			IPAddress:  ip,
		}
		database.DB.Create(&logEntry)
	}
	return err
}

func fetchOldSchool(id uint) map[string]any {
	var s model.School
	if database.DB.First(&s, id).Error == nil {
		return schoolToMap(&s)
	}
	return nil
}

func schoolToMap(s *model.School) map[string]any {
	return map[string]any{
		"id":                 s.ID,
		"name":               s.Name,
		"cooperation_status": string(s.CooperationStatus),
		"contact_person":     s.ContactPerson,
	}
}

var _ = gorm.Model{}
