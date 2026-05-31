from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/diaries", tags=["diaries"])


@router.get("", response_model=List[schemas.ConstructionDiary])
def get_diaries(
    project_id: Optional[int] = None,
    team_id: Optional[int] = None,
    is_exception: Optional[bool] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    query = db.query(models.ConstructionDiary)
    if project_id:
        query = query.filter(models.ConstructionDiary.project_id == project_id)
    if team_id:
        query = query.filter(models.ConstructionDiary.team_id == team_id)
    if is_exception is not None:
        query = query.filter(models.ConstructionDiary.is_exception == is_exception)
    if status:
        query = query.filter(models.ConstructionDiary.status == status)
    return query.order_by(models.ConstructionDiary.report_date.desc()).all()


@router.get("/{diary_id}", response_model=schemas.ConstructionDiary)
def get_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    diary = db.query(models.ConstructionDiary).filter(models.ConstructionDiary.id == diary_id).first()
    if not diary:
        raise HTTPException(status_code=404, detail="施工日志不存在")
    return diary


@router.post("", response_model=schemas.ConstructionDiary)
def create_diary(
    diary: schemas.ConstructionDiaryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_diary = models.ConstructionDiary(**diary.model_dump())
    db.add(db_diary)
    db.commit()
    db.refresh(db_diary)
    return db_diary


@router.put("/{diary_id}", response_model=schemas.ConstructionDiary)
def update_diary(
    diary_id: int,
    diary_update: schemas.ConstructionDiaryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_diary = db.query(models.ConstructionDiary).filter(models.ConstructionDiary.id == diary_id).first()
    if not db_diary:
        raise HTTPException(status_code=404, detail="施工日志不存在")
    update_data = diary_update.model_dump(exclude_unset=True)
    if "exception_handled" in update_data and update_data["exception_handled"]:
        update_data["exception_handled_at"] = datetime.utcnow()
        update_data["exception_handler_id"] = current_user.id
    for key, value in update_data.items():
        setattr(db_diary, key, value)
    db.commit()
    db.refresh(db_diary)
    return db_diary


@router.post("/{diary_id}/handle-exception")
def handle_exception(
    diary_id: int,
    handle_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_diary = db.query(models.ConstructionDiary).filter(models.ConstructionDiary.id == diary_id).first()
    if not db_diary:
        raise HTTPException(status_code=404, detail="施工日志不存在")
    db_diary.exception_handled = True
    db_diary.exception_handler_id = current_user.id
    db_diary.exception_handle_note = handle_data.get("note", "")
    db_diary.exception_handled_at = datetime.utcnow()
    db_diary.status = "exception_handled"
    db.commit()
    db.refresh(db_diary)
    return {"message": "异常已处理", "diary": db_diary}
