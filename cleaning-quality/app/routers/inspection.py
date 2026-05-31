from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.inspection import InspectionCreate, InspectionUpdate, InspectionOut, InspectionItemScore, InspectionItemOut
from app.schemas.operator import OperatorContext
from app.dependencies import get_operator_context
from app.services.state_machine import ConcurrentTransitionError, StateTransitionError
from app.services.idempotency import check_idempotency, create_idempotency_record, DuplicateSubmissionError, MissingIdempotencyKeyError
from app.services import inspection as svc

router = APIRouter(prefix="/inspections", tags=["质检抽查"])


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
def create_inspection(
    data: InspectionCreate,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    if not x_idempotency_key:
        raise HTTPException(400, f"缺少幂等键: 请在请求头中提供 X-Idempotency-Key 用于 inspection 操作的重复提交保护")
    try:
        check_idempotency(db, x_idempotency_key, "inspection", operator.operator_id)
        i = svc.create_inspection(db, data, operator.operator_id, operator.operator_name, operator.operator_role)
        create_idempotency_record(db, x_idempotency_key, "inspection", i.id, operator.operator_id)
        db.commit()
        db.refresh(i)
        return i
    except DuplicateSubmissionError as e:
        db.rollback()
        raise HTTPException(409, str(e))
    except MissingIdempotencyKeyError as e:
        db.rollback()
        raise HTTPException(400, str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(400, str(e))


@router.put("/{inspection_id}/status", response_model=InspectionOut)
def update_inspection_status(
    inspection_id: int,
    data: InspectionUpdate,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_expected_version: Optional[int] = Header(None, alias="X-Expected-Version"),
):
    if x_expected_version is None:
        raise HTTPException(400, f"缺少预期版本号: 请在请求头中提供 X-Expected-Version 用于 inspection 的 status update 操作的并发控制")
    try:
        i = svc.update_inspection_status(
            db, inspection_id, data,
            operator.operator_id, operator.operator_name, operator.operator_role,
            expected_version=x_expected_version
        )
    except (ValueError, StateTransitionError) as e:
        db.rollback()
        raise HTTPException(400, str(e))
    except ConcurrentTransitionError as e:
        db.rollback()
        raise HTTPException(409, str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(400, str(e))
    if not i:
        raise HTTPException(404, "质检记录不存在")
    return i


@router.put("/items/{item_id}/score", response_model=InspectionItemOut)
def score_item(
    item_id: int,
    data: InspectionItemScore,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
):
    item = svc.score_inspection_item(db, item_id, data, operator.operator_id, operator.operator_name, operator.operator_role)
    if not item:
        raise HTTPException(404, "检查项不存在")
    return item
