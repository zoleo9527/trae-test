from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.consumable import (
    ConsumableCreate,
    ConsumableUpdate,
    ConsumableOut,
    ConsumableOrderCreate,
    ConsumableOrderApprove,
    ConsumableOrderOut,
)
from app.schemas.operator import OperatorContext
from app.dependencies import get_operator_context
from app.services.state_machine import ConcurrentTransitionError, StateTransitionError
from app.services.idempotency import check_idempotency, create_idempotency_record, DuplicateSubmissionError, MissingIdempotencyKeyError
from app.services import consumable as svc

router = APIRouter(prefix="/consumables", tags=["耗材管理"])


@router.get("", response_model=list[ConsumableOut])
def list_consumables(project_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    return svc.get_consumables(db, project_id, status)


@router.post("", response_model=ConsumableOut, status_code=201)
def create_consumable(
    data: ConsumableCreate,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    if not x_idempotency_key:
        raise HTTPException(400, f"缺少幂等键: 请在请求头中提供 X-Idempotency-Key 用于 consumable 操作的重复提交保护")
    try:
        check_idempotency(db, x_idempotency_key, "consumable", operator.operator_id)
        c = svc.create_consumable(db, data, operator.operator_id, operator.operator_name, operator.operator_role)
        create_idempotency_record(db, x_idempotency_key, "consumable", c.id, operator.operator_id)
        db.commit()
        db.refresh(c)
        return c
    except DuplicateSubmissionError as e:
        db.rollback()
        raise HTTPException(409, str(e))
    except MissingIdempotencyKeyError as e:
        db.rollback()
        raise HTTPException(400, str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(400, str(e))


@router.get("/orders", response_model=list[ConsumableOrderOut])
def list_orders(project_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    return svc.get_consumable_orders(db, project_id, status)


@router.post("/orders", response_model=ConsumableOrderOut, status_code=201)
def create_order(
    data: ConsumableOrderCreate,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    if not x_idempotency_key:
        raise HTTPException(400, f"缺少幂等键: 请在请求头中提供 X-Idempotency-Key 用于 consumable_order 操作的重复提交保护")
    try:
        check_idempotency(db, x_idempotency_key, "consumable_order", operator.operator_id)
        o = svc.create_consumable_order(db, data, operator.operator_id, operator.operator_name, operator.operator_role)
        create_idempotency_record(db, x_idempotency_key, "consumable_order", o.id, operator.operator_id)
        db.commit()
        db.refresh(o)
        return o
    except DuplicateSubmissionError as e:
        db.rollback()
        raise HTTPException(409, str(e))
    except MissingIdempotencyKeyError as e:
        db.rollback()
        raise HTTPException(400, str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(400, str(e))


@router.post("/orders/{order_id}/approve", response_model=ConsumableOrderOut)
def approve_order(
    order_id: int,
    data: ConsumableOrderApprove,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_expected_version: Optional[int] = Header(None, alias="X-Expected-Version"),
):
    if x_expected_version is None:
        raise HTTPException(400, f"缺少预期版本号: 请在请求头中提供 X-Expected-Version 用于 consumable_order 的 approve 操作的并发控制")
    try:
        o = svc.approve_consumable_order(
            db, order_id, data,
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
    if not o:
        raise HTTPException(404, "补货单不存在")
    return o


@router.post("/orders/{order_id}/fulfill", response_model=ConsumableOrderOut)
def fulfill_order(
    order_id: int,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_expected_version: Optional[int] = Header(None, alias="X-Expected-Version"),
):
    if x_expected_version is None:
        raise HTTPException(400, f"缺少预期版本号: 请在请求头中提供 X-Expected-Version 用于 consumable_order 的 fulfill 操作的并发控制")
    try:
        o = svc.fulfill_consumable_order(
            db, order_id,
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
    if not o:
        raise HTTPException(404, "补货单不存在")
    return o


@router.get("/{consumable_id}", response_model=ConsumableOut)
def get_consumable(consumable_id: int, db: Session = Depends(get_db)):
    c = svc.get_consumable(db, consumable_id)
    if not c:
        raise HTTPException(404, "耗材不存在")
    return c


@router.put("/{consumable_id}", response_model=ConsumableOut)
def update_consumable(
    consumable_id: int,
    data: ConsumableUpdate,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_expected_version: Optional[int] = Header(None, alias="X-Expected-Version"),
):
    if x_expected_version is None:
        raise HTTPException(400, f"缺少预期版本号: 请在请求头中提供 X-Expected-Version 用于 consumable 的 update 操作的并发控制")
    try:
        c = svc.update_consumable(
            db, consumable_id, data,
            operator.operator_id, operator.operator_name, operator.operator_role,
            expected_version=x_expected_version
        )
    except ConcurrentTransitionError as e:
        db.rollback()
        raise HTTPException(409, str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(400, str(e))
    if not c:
        raise HTTPException(404, "耗材不存在")
    return c
