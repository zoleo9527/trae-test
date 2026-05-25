from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.auth import get_current_user
from app.models import User, Allocation, Purchase, Customer, Grading
from app.schemas import AllocationIn, AllocationOut, AllocationStatusUpdate

router = APIRouter(prefix="/api/allocations", tags=["allocations"])


def _enrich(a: Allocation) -> dict:
    return {
        "id": a.id, "purchase_id": a.purchase_id,
        "purchase_code": a.purchase.code if a.purchase else None,
        "customer_id": a.customer_id,
        "customer_name": a.customer.name if a.customer else None,
        "customer_stall": a.customer.stall_code if a.customer else None,
        "grade": a.grade, "qty_kg": a.qty_kg, "unit_price": a.unit_price,
        "total_amount": a.total_amount, "status": a.status,
        "allocated_at": a.allocated_at, "operator": a.operator, "remark": a.remark,
    }


@router.get("", response_model=list[AllocationOut])
def list_allocations(
    purchase_id: Optional[int] = Query(None),
    customer_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Allocation).join(Purchase).join(Customer)
    if purchase_id:
        q = q.filter(Allocation.purchase_id == purchase_id)
    if customer_id:
        q = q.filter(Allocation.customer_id == customer_id)
    if status:
        q = q.filter(Allocation.status == status)
    items = q.order_by(Allocation.allocated_at.desc()).all()
    return [_enrich(a) for a in items]


@router.post("", response_model=AllocationOut)
def create_allocation(req: AllocationIn, db: Session = Depends(get_db),
                      current: User = Depends(get_current_user)):
    p = db.query(Purchase).get(req.purchase_id)
    if not p:
        raise HTTPException(404, "进货单不存在")
    customer = db.query(Customer).get(req.customer_id)
    if not customer:
        raise HTTPException(404, "客户不存在")

    graded = db.query(Grading).filter(
        Grading.purchase_id == req.purchase_id,
        Grading.grade == req.grade,
    ).all()
    graded_kg = sum(g.weight_kg for g in graded)
    if graded_kg == 0:
        raise HTTPException(400, f"该等级 {req.grade} 还没有分级，无法配货")

    allocated_kg = db.query(Allocation).filter(
        Allocation.purchase_id == req.purchase_id,
        Allocation.grade == req.grade,
        Allocation.status != "已退货",
    ).all()
    allocated_sum = sum(a.qty_kg for a in allocated_kg)
    remaining = graded_kg - allocated_sum
    if req.qty_kg > remaining:
        raise HTTPException(400, f"{req.grade} 级剩余 {remaining:.1f} 斤，配货量超出")

    a = Allocation(
        purchase_id=req.purchase_id,
        customer_id=req.customer_id,
        grade=req.grade,
        qty_kg=req.qty_kg,
        unit_price=req.unit_price,
        total_amount=req.qty_kg * req.unit_price,
        status="待提货",
        allocated_at=datetime.now(),
        operator=current.name,
        remark=req.remark,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return _enrich(a)


@router.patch("/{allocation_id}/status")
def update_status(allocation_id: int, req: AllocationStatusUpdate,
                  db: Session = Depends(get_db),
                  _: User = Depends(get_current_user)):
    a = db.query(Allocation).get(allocation_id)
    if not a:
        raise HTTPException(404, "配货单不存在")
    a.status = req.status
    db.commit()
    return {"ok": True}


@router.delete("/{allocation_id}")
def delete_allocation(allocation_id: int, db: Session = Depends(get_db),
                      _: User = Depends(get_current_user)):
    a = db.query(Allocation).get(allocation_id)
    if not a:
        raise HTTPException(404, "配货单不存在")
    if a.sales:
        raise HTTPException(400, "已生成赊销单，不能直接删除")
    db.delete(a)
    db.commit()
    return {"ok": True}
