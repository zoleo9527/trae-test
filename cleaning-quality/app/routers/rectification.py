from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.rectification import RectificationCreate, RectificationAssign, RectificationSubmit, RectificationReview, RectificationOut
from app.services import rectification as svc

router = APIRouter(prefix="/rectifications", tags=["整改闭环"])


def _op():
    return "op_default", "默认操作员", "project_manager"


@router.get("", response_model=list[RectificationOut])
def list_rectifications(
    project_id: Optional[int] = None,
    inspection_id: Optional[int] = None,
    status: Optional[str] = None,
    assignee_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return svc.get_rectifications(db, project_id, inspection_id, status, assignee_id)


@router.get("/{rectification_id}", response_model=RectificationOut)
def get_rectification(rectification_id: int, db: Session = Depends(get_db)):
    r = svc.get_rectification(db, rectification_id)
    if not r:
        raise HTTPException(404, "整改单不存在")
    return r


@router.post("", response_model=RectificationOut, status_code=201)
def create_rectification(data: RectificationCreate, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    return svc.create_rectification(db, data, op_id, op_name, op_role)


@router.post("/{rectification_id}/assign", response_model=RectificationOut)
def assign_rectification(rectification_id: int, data: RectificationAssign, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    try:
        r = svc.assign_rectification(db, rectification_id, data, op_id, op_name, op_role)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not r:
        raise HTTPException(404, "整改单不存在")
    return r


@router.post("/{rectification_id}/start", response_model=RectificationOut)
def start_rectification(rectification_id: int, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    try:
        r = svc.start_rectification(db, rectification_id, op_id, op_name, op_role)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not r:
        raise HTTPException(404, "整改单不存在")
    return r


@router.post("/{rectification_id}/submit", response_model=RectificationOut)
def submit_rectification(rectification_id: int, data: RectificationSubmit, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    try:
        r = svc.submit_rectification(db, rectification_id, data, op_id, op_name, op_role)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not r:
        raise HTTPException(404, "整改单不存在")
    return r


@router.post("/{rectification_id}/review", response_model=RectificationOut)
def review_rectification(rectification_id: int, data: RectificationReview, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    try:
        r = svc.review_rectification(db, rectification_id, data, op_id, op_name, op_role)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not r:
        raise HTTPException(404, "整改单不存在")
    return r
