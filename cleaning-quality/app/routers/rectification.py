from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.rectification import RectificationCreate, RectificationAssign, RectificationSubmit, RectificationReview, RectificationOut
from app.schemas.operator import OperatorContext
from app.dependencies import get_operator_context
from app.services.state_machine import ConcurrentTransitionError, StateTransitionError
from app.services.idempotency import check_idempotency, create_idempotency_record, DuplicateSubmissionError, MissingIdempotencyKeyError
from app.services import rectification as svc

router = APIRouter(prefix="/rectifications", tags=["整改闭环"])


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
def create_rectification(
    data: RectificationCreate,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    if not x_idempotency_key:
        raise HTTPException(400, f"缺少幂等键: 请在请求头中提供 X-Idempotency-Key 用于 rectification 操作的重复提交保护")
    try:
        check_idempotency(db, x_idempotency_key, "rectification", operator.operator_id)
        r = svc.create_rectification(db, data, operator.operator_id, operator.operator_name, operator.operator_role)
        create_idempotency_record(db, x_idempotency_key, "rectification", r.id, operator.operator_id)
        db.commit()
        db.refresh(r)
        return r
    except DuplicateSubmissionError as e:
        db.rollback()
        raise HTTPException(409, str(e))
    except MissingIdempotencyKeyError as e:
        db.rollback()
        raise HTTPException(400, str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(400, str(e))


@router.post("/{rectification_id}/assign", response_model=RectificationOut)
def assign_rectification(
    rectification_id: int,
    data: RectificationAssign,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_expected_version: Optional[int] = Header(None, alias="X-Expected-Version"),
):
    if x_expected_version is None:
        raise HTTPException(400, f"缺少预期版本号: 请在请求头中提供 X-Expected-Version 用于 rectification 的 assign 操作的并发控制")
    try:
        r = svc.assign_rectification(
            db, rectification_id, data,
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
    if not r:
        raise HTTPException(404, "整改单不存在")
    return r


@router.post("/{rectification_id}/start", response_model=RectificationOut)
def start_rectification(
    rectification_id: int,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_expected_version: Optional[int] = Header(None, alias="X-Expected-Version"),
):
    if x_expected_version is None:
        raise HTTPException(400, f"缺少预期版本号: 请在请求头中提供 X-Expected-Version 用于 rectification 的 start 操作的并发控制")
    try:
        r = svc.start_rectification(
            db, rectification_id,
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
    if not r:
        raise HTTPException(404, "整改单不存在")
    return r


@router.post("/{rectification_id}/submit", response_model=RectificationOut)
def submit_rectification(
    rectification_id: int,
    data: RectificationSubmit,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_expected_version: Optional[int] = Header(None, alias="X-Expected-Version"),
):
    if x_expected_version is None:
        raise HTTPException(400, f"缺少预期版本号: 请在请求头中提供 X-Expected-Version 用于 rectification 的 submit 操作的并发控制")
    try:
        r = svc.submit_rectification(
            db, rectification_id, data,
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
    if not r:
        raise HTTPException(404, "整改单不存在")
    return r


@router.post("/{rectification_id}/review", response_model=RectificationOut)
def review_rectification(
    rectification_id: int,
    data: RectificationReview,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_expected_version: Optional[int] = Header(None, alias="X-Expected-Version"),
):
    if x_expected_version is None:
        raise HTTPException(400, f"缺少预期版本号: 请在请求头中提供 X-Expected-Version 用于 rectification 的 review 操作的并发控制")
    try:
        r = svc.review_rectification(
            db, rectification_id, data,
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
    if not r:
        raise HTTPException(404, "整改单不存在")
    return r
