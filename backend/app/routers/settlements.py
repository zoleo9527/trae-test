from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/settlements", tags=["settlements"])


@router.get("", response_model=List[schemas.TeamSettlement])
def get_settlements(
    project_id: Optional[int] = None,
    team_id: Optional[int] = None,
    status: Optional[str] = None,
    has_dispute: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    query = db.query(models.TeamSettlement)
    if project_id:
        query = query.filter(models.TeamSettlement.project_id == project_id)
    if team_id:
        query = query.filter(models.TeamSettlement.team_id == team_id)
    if status:
        query = query.filter(models.TeamSettlement.status == status)
    if has_dispute is not None:
        query = query.filter(models.TeamSettlement.has_dispute == has_dispute)
    return query.order_by(models.TeamSettlement.created_at.desc()).all()


@router.get("/{settlement_id}", response_model=schemas.TeamSettlement)
def get_settlement(
    settlement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    settlement = db.query(models.TeamSettlement).filter(models.TeamSettlement.id == settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="结算单不存在")
    return settlement


@router.post("", response_model=schemas.TeamSettlement)
def create_settlement(
    settlement: schemas.TeamSettlementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_settlement = models.TeamSettlement(**settlement.model_dump())
    db.add(db_settlement)
    db.commit()
    db.refresh(db_settlement)
    return db_settlement


@router.put("/{settlement_id}", response_model=schemas.TeamSettlement)
def update_settlement(
    settlement_id: int,
    settlement_update: schemas.TeamSettlementUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_settlement = db.query(models.TeamSettlement).filter(models.TeamSettlement.id == settlement_id).first()
    if not db_settlement:
        raise HTTPException(status_code=404, detail="结算单不存在")
    update_data = settlement_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_settlement, key, value)
    db.commit()
    db.refresh(db_settlement)
    return db_settlement


@router.post("/{settlement_id}/resolve-dispute")
def resolve_dispute(
    settlement_id: int,
    resolution_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_settlement = db.query(models.TeamSettlement).filter(models.TeamSettlement.id == settlement_id).first()
    if not db_settlement:
        raise HTTPException(status_code=404, detail="结算单不存在")
    db_settlement.dispute_resolved = True
    db_settlement.dispute_resolution = resolution_data.get("resolution", "")
    db_settlement.final_amount = resolution_data.get("final_amount", db_settlement.final_amount)
    db_settlement.status = "dispute_resolved"
    db.commit()
    db.refresh(db_settlement)
    return {"message": "争议已解决", "settlement": db_settlement}
