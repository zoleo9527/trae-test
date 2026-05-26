from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models import User, CreditSale, Payment, Allocation, Customer
from app.schemas import (
    CreditSaleIn, CreditSaleOut, PaymentIn, PaymentOut,
)

router = APIRouter(prefix="/api/sales", tags=["sales"])


def _enrich_sale(s: CreditSale) -> dict:
    return {
        "id": s.id, "allocation_id": s.allocation_id,
        "customer_id": s.customer_id,
        "customer_name": s.customer.name if s.customer else None,
        "total_amount": s.total_amount, "paid_amount": s.paid_amount,
        "balance": s.balance, "due_date": s.due_date, "status": s.status,
        "created_at": s.created_at, "remark": s.remark,
    }


def _enrich_payment(p: Payment) -> dict:
    return {
        "id": p.id, "sale_id": p.sale_id, "amount": p.amount, "method": p.method,
        "paid_at": p.paid_at, "operator": p.operator, "remark": p.remark,
    }


def _refresh_status(db: Session, s: CreditSale):
    if s.balance <= 0:
        s.status = "已结清"
    elif s.due_date and s.due_date < datetime.now():
        s.status = "逾期"
    elif s.paid_amount > 0:
        s.status = "部分回款"
    else:
        s.status = "赊销中"


@router.get("", response_model=list[CreditSaleOut])
def list_sales(
    customer_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    overdue_only: bool = Query(False),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("stall_manager", "finance")),
):
    q = db.query(CreditSale).join(Customer)
    if customer_id:
        q = q.filter(CreditSale.customer_id == customer_id)
    if status:
        q = q.filter(CreditSale.status == status)
    items = q.order_by(CreditSale.created_at.desc()).all()
    out = []
    for s in items:
        _refresh_status(db, s)
        data = _enrich_sale(s)
        if overdue_only and data["status"] != "逾期":
            continue
        out.append(data)
    db.commit()
    return out


@router.get("/{sale_id}", response_model=CreditSaleOut)
def get_sale(sale_id: int, db: Session = Depends(get_db),
             _: User = Depends(get_current_user)):
    s = db.query(CreditSale).get(sale_id)
    if not s:
        raise HTTPException(404, "赊销单不存在")
    _refresh_status(db, s)
    db.commit()
    return _enrich_sale(s)


@router.post("", response_model=CreditSaleOut)
def create_sale(req: CreditSaleIn, db: Session = Depends(get_db),
                current: User = Depends(require_roles("stall_manager", "picker"))):
    a = db.query(Allocation).get(req.allocation_id)
    if not a:
        raise HTTPException(404, "配货单不存在")
    existing = db.query(CreditSale).filter(CreditSale.allocation_id == a.id).first()
    if existing:
        raise HTTPException(400, "该配货单已有赊销记录")
    s = CreditSale(
        allocation_id=a.id,
        customer_id=a.customer_id,
        total_amount=a.total_amount,
        paid_amount=0,
        balance=a.total_amount,
        due_date=req.due_date or (datetime.now() + timedelta(days=7)),
        status="赊销中",
        created_at=datetime.now(),
        remark=req.remark,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return _enrich_sale(s)


@router.post("/{sale_id}/pay", response_model=PaymentOut)
def pay_sale(sale_id: int, req: PaymentIn, db: Session = Depends(get_db),
             current: User = Depends(require_roles("stall_manager", "finance"))):
    s = db.query(CreditSale).get(sale_id)
    if not s:
        raise HTTPException(404, "赊销单不存在")
    if req.amount > s.balance:
        raise HTTPException(400, f"回款金额超过未结余额 {s.balance:.2f}")
    s.paid_amount += req.amount
    s.balance -= req.amount
    _refresh_status(db, s)
    p = Payment(
        sale_id=sale_id,
        amount=req.amount,
        method=req.method,
        paid_at=datetime.now(),
        operator=req.operator or current.name,
        remark=req.remark,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return _enrich_payment(p)


@router.get("/{sale_id}/payments", response_model=list[PaymentOut])
def list_payments(sale_id: int, db: Session = Depends(get_db),
                  _: User = Depends(get_current_user)):
    ps = db.query(Payment).filter(Payment.sale_id == sale_id).order_by(Payment.paid_at.desc()).all()
    return [_enrich_payment(p) for p in ps]
