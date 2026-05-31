from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
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
from app.services import consumable as svc

router = APIRouter(prefix="/consumables", tags=["耗材管理"])


def _op():
    return "op_default", "默认操作员", "schedule_staff"


@router.get("", response_model=list[ConsumableOut])
def list_consumables(project_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    return svc.get_consumables(db, project_id, status)


@router.get("/{consumable_id}", response_model=ConsumableOut)
def get_consumable(consumable_id: int, db: Session = Depends(get_db)):
    c = svc.get_consumable(db, consumable_id)
    if not c:
        raise HTTPException(404, "耗材不存在")
    return c


@router.post("", response_model=ConsumableOut, status_code=201)
def create_consumable(data: ConsumableCreate, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    return svc.create_consumable(db, data, op_id, op_name, op_role)


@router.put("/{consumable_id}", response_model=ConsumableOut)
def update_consumable(consumable_id: int, data: ConsumableUpdate, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    c = svc.update_consumable(db, consumable_id, data, op_id, op_name, op_role)
    if not c:
        raise HTTPException(404, "耗材不存在")
    return c


@router.get("/orders", response_model=list[ConsumableOrderOut])
def list_orders(project_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    return svc.get_consumable_orders(db, project_id, status)


@router.post("/orders", response_model=ConsumableOrderOut, status_code=201)
def create_order(data: ConsumableOrderCreate, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    return svc.create_consumable_order(db, data, op_id, op_name, op_role)


@router.post("/orders/{order_id}/approve", response_model=ConsumableOrderOut)
def approve_order(order_id: int, data: ConsumableOrderApprove, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    try:
        o = svc.approve_consumable_order(db, order_id, data, op_id, op_name, op_role)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not o:
        raise HTTPException(404, "补货单不存在")
    return o


@router.post("/orders/{order_id}/fulfill", response_model=ConsumableOrderOut)
def fulfill_order(order_id: int, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    try:
        o = svc.fulfill_consumable_order(db, order_id, op_id, op_name, op_role)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not o:
        raise HTTPException(404, "补货单不存在")
    return o
