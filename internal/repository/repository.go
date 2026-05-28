package repository

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrRecordNotFound = errors.New("record not found")
	ErrDuplicate      = errors.New("duplicate record")
	ErrInvalidStatus  = errors.New("invalid status transition")
	ErrCapacityFull   = errors.New("capacity full")
)

type Repositories struct {
	User         *UserRepository
	Camp         *CampRepository
	Room         *RoomRepository
	Camper       *CamperRepository
	Registration *RegistrationRepository
	Activity     *ActivityRepository
	Attendance   *AttendanceRepository
	Medical      *MedicalRepository
	Supply       *SupplyRepository
	Audit        *AuditRepository
}

func NewRepositories(db *gorm.DB) *Repositories {
	return &Repositories{
		User:         NewUserRepository(db),
		Camp:         NewCampRepository(db),
		Room:         NewRoomRepository(db),
		Camper:       NewCamperRepository(db),
		Registration: NewRegistrationRepository(db),
		Activity:     NewActivityRepository(db),
		Attendance:   NewAttendanceRepository(db),
		Medical:      NewMedicalRepository(db),
		Supply:       NewSupplyRepository(db),
		Audit:        NewAuditRepository(db),
	}
}

type baseRepository struct {
	db *gorm.DB
}

func (r *baseRepository) Create(model interface{}) error {
	return r.db.Create(model).Error
}

func (r *baseRepository) Update(model interface{}) error {
	return r.db.Save(model).Error
}

func (r *baseRepository) Delete(model interface{}) error {
	return r.db.Delete(model).Error
}

func (r *baseRepository) GetByID(id uuid.UUID, model interface{}) error {
	result := r.db.First(model, "id = ?", id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return ErrRecordNotFound
		}
		return result.Error
	}
	return nil
}

func (r *baseRepository) List(models interface{}, conditions map[string]interface{}, offset, limit int) (int64, error) {
	query := r.db.Model(models)
	for key, value := range conditions {
		query = query.Where(key, value)
	}

	var total int64
	query.Count(&total)

	if limit > 0 {
		query = query.Offset(offset).Limit(limit)
	}

	err := query.Find(models).Error
	return total, err
}

type QueryFilter struct {
	Field    string
	Operator string
	Value    interface{}
}

type QueryOptions struct {
	Filters  []QueryFilter
	SortBy   string
	SortDesc bool
	Offset   int
	Limit    int
	Preload  []string
}

func (r *baseRepository) Query(models interface{}, opts QueryOptions) (int64, error) {
	query := r.db.Model(models)

	for _, filter := range opts.Filters {
		switch filter.Operator {
		case "eq":
			query = query.Where(filter.Field+" = ?", filter.Value)
		case "ne":
			query = query.Where(filter.Field+" != ?", filter.Value)
		case "gt":
			query = query.Where(filter.Field+" > ?", filter.Value)
		case "gte":
			query = query.Where(filter.Field+" >= ?", filter.Value)
		case "lt":
			query = query.Where(filter.Field+" < ?", filter.Value)
		case "lte":
			query = query.Where(filter.Field+" <= ?", filter.Value)
		case "like":
			query = query.Where(filter.Field+" LIKE ?", "%"+filter.Value.(string)+"%")
		case "in":
			query = query.Where(filter.Field+" IN ?", filter.Value)
		case "is_null":
			query = query.Where(filter.Field + " IS NULL")
		case "is_not_null":
			query = query.Where(filter.Field + " IS NOT NULL")
		}
	}

	var total int64
	query.Count(&total)

	for _, preload := range opts.Preload {
		query = query.Preload(preload)
	}

	if opts.SortBy != "" {
		order := opts.SortBy
		if opts.SortDesc {
			order += " DESC"
		}
		query = query.Order(order)
	}

	if opts.Limit > 0 {
		query = query.Offset(opts.Offset).Limit(opts.Limit)
	}

	err := query.Find(models).Error
	return total, err
}
