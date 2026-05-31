from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.inspection import InspectionCreate, InspectionUpdate, InspectionOut, InspectionItemScore, InspectionItemOut
from app.services import inspection as svc

router = APIRouter(prefix="/inspections", tags=["质检抽查"])


def _op():
    return "op_default", "默认操作员", "inspector"


@router.get("", response_model=list[InspectionOut])
def list_inspections(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    inspector_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return svc.get_inspections(db, project_id, status, inspector_id)


@router.get("/{inspection_id}", response_model=InspectionOut)
def get_inspection(inspection_id: int, db: Session = Depends(get_db)):
    i = svc.get_inspection(db, inspection_id)
    if not i:
        raise HTTPException(404, "质检记录不存在")
    return i


@router.post("", response_model=InspectionOut, status_code=201)
def create_inspection(data: InspectionCreate, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    return svc.create_inspection(db, data, op_id, op_name, op_role)


@router.put("/{inspection_id}/status", response_model=InspectionOut)
def update_inspection_status(inspection_id: int, data: InspectionUpdate, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    try:
        i = svc.update_inspection_status(db, inspection_id, data, op_id, op_name, op_role)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not i:
        raise HTTPException(404, "质检记录不存在")
    return i


@router.put("/items/{item_id}/score", response_model=InspectionItemOut)
def score_item(item_id: int, data: InspectionItemScore, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    item = svc.score_inspection_item(db, item_id, data, op_id, op_name, op_role)
    if not item:
        raise HTTPException(404, "检查项不存在")
    return item
