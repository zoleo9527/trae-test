package repository

import (
	"floor-settlement/internal/model"

	"github.com/google/uuid"
)

type ProjectRepository struct{}

func (r *ProjectRepository) FindByID(id uuid.UUID) (*model.Project, error) {
	var project model.Project
	if err := db.Where("id = ?", id).First(&project).Error; err != nil {
		return nil, err
	}
	return &project, nil
}

func (r *ProjectRepository) Create(project *model.Project) error {
	return db.Create(project).Error
}

func (r *ProjectRepository) Update(project *model.Project) error {
	return db.Save(project).Error
}

func (r *ProjectRepository) List() ([]model.Project, error) {
	var projects []model.Project
	if err := db.Find(&projects).Error; err != nil {
		return nil, err
	}
	return projects, nil
}

func (r *ProjectRepository) FilterByStatus(status string) ([]model.Project, error) {
	var projects []model.Project
	if err := db.Where("status = ?", status).Find(&projects).Error; err != nil {
		return nil, err
	}
	return projects, nil
}
