package repository

import (
	"floor-settlement/internal/model"

	"github.com/google/uuid"
)

type TeamRepository struct{}

func (r *TeamRepository) FindByID(id uuid.UUID) (*model.Team, error) {
	var team model.Team
	if err := db.Where("id = ?", id).First(&team).Error; err != nil {
		return nil, err
	}
	return &team, nil
}

func (r *TeamRepository) Create(team *model.Team) error {
	return db.Create(team).Error
}

func (r *TeamRepository) Update(team *model.Team) error {
	return db.Save(team).Error
}

func (r *TeamRepository) ListByProject(projectID uuid.UUID) ([]model.Team, error) {
	var teams []model.Team
	if err := db.Where("project_id = ?", projectID).Find(&teams).Error; err != nil {
		return nil, err
	}
	return teams, nil
}

func (r *TeamRepository) FindByIDsWithProject(teamIDs []uuid.UUID) ([]model.Team, error) {
	var teams []model.Team
	if err := db.Where("id IN ?", teamIDs).Find(&teams).Error; err != nil {
		return nil, err
	}
	return teams, nil
}
