from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/inspections", tags=["inspections"])


@router.get("", response_model=List[schemas.QualityInspection])
def get_inspections(
    project_id: Optional[int] = None,
    diary_id: Optional[int] = None,
    status: Optional[str] = None,
    rework_required: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    query = db.query(models.QualityInspection)
    if project_id:
        query = query.filter(models.QualityInspection.project_id == project_id)
    if diary_id:
        query = query.filter(models.QualityInspection.diary_id == diary_id)
    if status:
        query = query.filter(models.QualityInspection.status == status)
    if rework_required is not None:
        query = query.filter(models.QualityInspection.rework_required == rework_required)
    return query.order_by(models.QualityInspection.inspection_date.desc()).all()


@router.get("/{inspection_id}", response_model=schemas.QualityInspection)
def get_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    inspection = db.query(models.QualityInspection).filter(models.QualityInspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="质量检查记录不存在")
    return inspection


@router.post("", response_model=schemas.QualityInspection)
def create_inspection(
    inspection: schemas.QualityInspectionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_inspection = models.QualityInspection(**inspection.model_dump())
    db.add(db_inspection)
    db.commit()
    db.refresh(db_inspection)
    return db_inspection


@router.put("/{inspection_id}", response_model=schemas.QualityInspection)
def update_inspection(
    inspection_id: int,
    inspection_update: schemas.QualityInspectionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_inspection = db.query(models.QualityInspection).filter(models.QualityInspection.id == inspection_id).first()
    if not db_inspection:
        raise HTTPException(status_code=404, detail="质量检查记录不存在")
    update_data = inspection_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_inspection, key, value)
    db.commit()
    db.refresh(db_inspection)
    return db_inspection


@router.post("/{inspection_id}/complete-rectification")
def complete_rectification(
    inspection_id: int,
    rectification_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_inspection = db.query(models.QualityInspection).filter(models.QualityInspection.id == inspection_id).first()
    if not db_inspection:
        raise HTTPException(status_code=404, detail="质量检查记录不存在")
    db_inspection.rectification_completed = True
    db_inspection.rectification_note = rectification_data.get("note", "")
    db_inspection.rectification_date = datetime.utcnow()
    db_inspection.status = "rectified"
    db.commit()
    db.refresh(db_inspection)
    return {"message": "整改已完成", "inspection": db_inspection}


@router.post("/{inspection_id}/reinspect")
def reinspect(
    inspection_id: int,
    reinspection_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_inspection = db.query(models.QualityInspection).filter(models.QualityInspection.id == inspection_id).first()
    if not db_inspection:
        raise HTTPException(status_code=404, detail="质量检查记录不存在")
    db_inspection.reinspection_result = reinspection_data.get("result")
    db_inspection.status = "completed" if reinspection_data.get("result") == "passed" else "rework_required"
    db.commit()
    db.refresh(db_inspection)
    return {"message": "复检完成", "inspection": db_inspection}
