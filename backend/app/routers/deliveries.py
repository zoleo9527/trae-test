from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/deliveries", tags=["deliveries"])


@router.get("", response_model=List[schemas.MaterialDelivery])
def get_deliveries(
    project_id: Optional[int] = None,
    has_quality_issue: Optional[bool] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    query = db.query(models.MaterialDelivery)
    if project_id:
        query = query.filter(models.MaterialDelivery.project_id == project_id)
    if has_quality_issue is not None:
        query = query.filter(models.MaterialDelivery.has_quality_issue == has_quality_issue)
    if status:
        query = query.filter(models.MaterialDelivery.status == status)
    return query.order_by(models.MaterialDelivery.delivery_date.desc()).all()


@router.get("/{delivery_id}", response_model=schemas.MaterialDelivery)
def get_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    delivery = db.query(models.MaterialDelivery).filter(models.MaterialDelivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="材料配送单不存在")
    return delivery


@router.post("", response_model=schemas.MaterialDelivery)
def create_delivery(
    delivery: schemas.MaterialDeliveryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_delivery = models.MaterialDelivery(**delivery.model_dump())
    db.add(db_delivery)
    db.commit()
    db.refresh(db_delivery)
    return db_delivery


@router.put("/{delivery_id}", response_model=schemas.MaterialDelivery)
def update_delivery(
    delivery_id: int,
    delivery_update: schemas.MaterialDeliveryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_delivery = db.query(models.MaterialDelivery).filter(models.MaterialDelivery.id == delivery_id).first()
    if not db_delivery:
        raise HTTPException(status_code=404, detail="材料配送单不存在")
    update_data = delivery_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_delivery, key, value)
    db.commit()
    db.refresh(db_delivery)
    return db_delivery
