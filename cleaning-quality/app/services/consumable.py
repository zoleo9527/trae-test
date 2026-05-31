from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.consumable import Consumable, ConsumableOrder
from app.schemas.consumable import (
    ConsumableCreate,
    ConsumableUpdate,
    ConsumableOrderCreate,
    ConsumableOrderApprove,
)
from app.services.audit import log_audit
from app.services.state_machine import auto_transition_consumable_status, check_optimistic_lock, increment_version


def get_consumables(db: Session, project_id: Optional[int] = None, status: Optional[str] = None) -> list[Consumable]:
    q = db.query(Consumable)
    if project_id is not None:
        q = q.filter(Consumable.project_id == project_id)
    if status is not None:
        q = q.filter(Consumable.status == status)
    return q.order_by(Consumable.created_at.desc()).all()


def get_consumable(db: Session, consumable_id: int) -> Optional[Consumable]:
    return db.query(Consumable).filter(Consumable.id == consumable_id).first()


def create_consumable(db: Session, data: ConsumableCreate, operator_id: str, operator_name: str, operator_role: str) -> Consumable:
    auto_status = auto_transition_consumable_status(data.current_stock, data.threshold)
    create_data = data.model_dump()
    create_data["status"] = auto_status
    consumable = Consumable(**create_data)
    db.add(consumable)
    db.flush()
    log_audit(
        db, "consumable", consumable.id, "create",
        operator_id, operator_name, operator_role,
        new_values=create_data,
    )
    db.commit()
    db.refresh(consumable)
    return consumable


def update_consumable(db: Session, consumable_id: int, data: ConsumableUpdate, operator_id: str, operator_name: str, operator_role: str, expected_version: Optional[int] = None) -> Optional[Consumable]:
    consumable = get_consumable(db, consumable_id)
    if not consumable:
        return None
    check_optimistic_lock(consumable, expected_version)
    old_values = {k: getattr(consumable, k) for k in data.model_dump(exclude_unset=True)}
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(consumable, k, v)
    new_stock = consumable.current_stock
    new_threshold = consumable.threshold
    new_status = auto_transition_consumable_status(new_stock, new_threshold)
    consumable.status = new_status
    log_audit(
        db, "consumable", consumable.id, "update",
        operator_id, operator_name, operator_role,
        old_values=old_values,
        new_values={**data.model_dump(exclude_unset=True), "status": new_status},
    )
    increment_version(consumable)
    db.commit()
    db.refresh(consumable)
    return consumable


def get_consumable_orders(db: Session, project_id: Optional[int] = None, status: Optional[str] = None) -> list[ConsumableOrder]:
    q = db.query(ConsumableOrder)
    if project_id is not None:
        q = q.filter(ConsumableOrder.project_id == project_id)
    if status is not None:
        q = q.filter(ConsumableOrder.status == status)
    return q.order_by(ConsumableOrder.created_at.desc()).all()


def create_consumable_order(db: Session, data: ConsumableOrderCreate, operator_id: str, operator_name: str, operator_role: str) -> ConsumableOrder:
    order = ConsumableOrder(**data.model_dump(), status="pending")
    db.add(order)
    db.flush()
    log_audit(
        db, "consumable_order", order.id, "create",
        operator_id, operator_name, operator_role,
        new_values=data.model_dump(),
        detail=f"耗材ID={data.consumable_id}，数量={data.quantity}",
    )
    db.commit()
    db.refresh(order)
    return order


def approve_consumable_order(db: Session, order_id: int, data: ConsumableOrderApprove, operator_id: str, operator_name: str, operator_role: str, expected_version: Optional[int] = None) -> Optional[ConsumableOrder]:
    order = db.query(ConsumableOrder).filter(ConsumableOrder.id == order_id).first()
    if not order:
        return None
    check_optimistic_lock(order, expected_version)
    if order.status != "pending":
        raise ValueError(f"补货单状态为 {order.status}，只有 pending 状态才可审批")
    old_status = order.status
    order.status = "approved"
    order.approved_by = data.approved_by
    order.approved_at = datetime.utcnow()
    log_audit(
        db, "consumable_order", order.id, "approve",
        operator_id, operator_name, operator_role,
        old_values={"status": old_status},
        new_values={"status": "approved", "approved_by": data.approved_by},
    )
    increment_version(order)
    db.commit()
    db.refresh(order)
    return order


def fulfill_consumable_order(db: Session, order_id: int, operator_id: str, operator_name: str, operator_role: str, expected_version: Optional[int] = None) -> Optional[ConsumableOrder]:
    order = db.query(ConsumableOrder).filter(ConsumableOrder.id == order_id).first()
    if not order:
        return None
    check_optimistic_lock(order, expected_version)
    if order.status != "approved":
        raise ValueError(f"补货单状态为 {order.status}，只有 approved 状态才可标记到货")
    old_status = order.status
    order.status = "fulfilled"
    order.fulfilled_at = datetime.utcnow()
    consumable = get_consumable(db, order.consumable_id)
    if consumable:
        old_stock = consumable.current_stock
        consumable.current_stock += order.quantity
        consumable.last_restock_date = datetime.utcnow()
        consumable.status = auto_transition_consumable_status(consumable.current_stock, consumable.threshold)
        log_audit(
            db, "consumable", consumable.id, "restock",
            operator_id, operator_name, operator_role,
            old_values={"current_stock": old_stock},
            new_values={"current_stock": consumable.current_stock, "status": consumable.status},
        )
    log_audit(
        db, "consumable_order", order.id, "fulfill",
        operator_id, operator_name, operator_role,
        old_values={"status": old_status},
        new_values={"status": "fulfilled"},
    )
    increment_version(order)
    db.commit()
    db.refresh(order)
    return order
