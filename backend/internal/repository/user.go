package repository

import (
	"floor-settlement/internal/model"

	"github.com/google/uuid"
)

type UserRepository struct{}

func (r *UserRepository) FindByUsername(username string) (*model.User, error) {
	var user model.User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByID(id uuid.UUID) (*model.User, error) {
	var user model.User
	if err := db.Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Create(user *model.User) error {
	return db.Create(user).Error
}

func (r *UserRepository) List() ([]model.User, error) {
	var users []model.User
	if err := db.Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}
