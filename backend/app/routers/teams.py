from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.get("", response_model=List[schemas.Team])
def get_teams(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return db.query(models.Team).all()


@router.get("/{team_id}", response_model=schemas.Team)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="班组不存在")
    return team


@router.post("", response_model=schemas.Team)
def create_team(
    team: schemas.TeamCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_team = models.Team(**team.model_dump())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team


@router.get("/{team_id}/diaries")
def get_team_diaries(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    diaries = db.query(models.ConstructionDiary).filter(
        models.ConstructionDiary.team_id == team_id
    ).order_by(models.ConstructionDiary.report_date.desc()).all()
    return diaries


@router.get("/{team_id}/settlements")
def get_team_settlements(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    settlements = db.query(models.TeamSettlement).filter(
        models.TeamSettlement.team_id == team_id
    ).order_by(models.TeamSettlement.created_at.desc()).all()
    return settlements
