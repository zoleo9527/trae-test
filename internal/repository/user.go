package repository

import (
	"camp-management/internal/model"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository struct {
	baseRepository
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{baseRepository{db: db}}
}

func (r *UserRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) GetByID(id uuid.UUID) (*model.User, error) {
	var user model.User
	if err := r.db.First(&user, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRecordNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetByUsername(username string) (*model.User, error) {
	var user model.User
	if err := r.db.First(&user, "username = ?", username).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRecordNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) ListByRole(role model.UserRole) ([]model.User, error) {
	var users []model.User
	err := r.db.Where("role = ?", role).Find(&users).Error
	return users, err
}

func (r *UserRepository) Update(user *model.User) error {
	return r.db.Save(user).Error
}
