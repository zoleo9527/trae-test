from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.database import get_db
from app.auth import get_current_user
from app.models import (
    User, Purchase, Grading, Allocation, CreditSale, ExceptionRecord,
    Supplier, Product, Customer, Payment,
)
from app.schemas import TraceOut, DashboardStats

router = APIRouter(prefix="/api/review", tags=["review"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    purchase_count = db.query(Purchase).count()
    total_net = db.query(func.sum(Purchase.net_kg)).scalar() or 0
    total_amount = db.query(func.sum(Purchase.total_amount)).scalar() or 0
    graded_sum = db.query(func.sum(Grading.weight_kg)).filter(Grading.grade != "损耗").scalar() or 0
    loss_sum = db.query(func.sum(Grading.weight_kg)).filter(Grading.grade == "损耗").scalar() or 0
    alloc_sum = db.query(func.sum(Allocation.qty_kg)).scalar() or 0
    credit_balance = db.query(func.sum(CreditSale.balance)).scalar() or 0
    overdue = db.query(CreditSale).filter(CreditSale.status == "逾期").count()
    open_exc = db.query(ExceptionRecord).filter(
        ExceptionRecord.status.in_(["待处理", "处理中"])
    ).count()

    graded_ratio = round(graded_sum / total_net, 4) if total_net else 0
    alloc_ratio = round(alloc_sum / total_net, 4) if total_net else 0
    loss_ratio = round(loss_sum / total_net, 4) if total_net else 0
    return {
        "purchase_count": purchase_count,
        "purchase_net_kg": round(total_net, 1),
        "purchase_total_amount": round(total_amount, 2),
        "graded_ratio": graded_ratio,
        "allocated_ratio": alloc_ratio,
        "loss_ratio": loss_ratio,
        "credit_balance": round(credit_balance, 2),
        "overdue_count": overdue,
        "open_exception_count": open_exc,
    }


def _sale_dict(s: CreditSale) -> dict:
    return {
        "id": s.id, "allocation_id": s.allocation_id,
        "customer_id": s.customer_id,
        "customer_name": s.customer.name if s.customer else None,
        "total_amount": s.total_amount, "paid_amount": s.paid_amount,
        "balance": s.balance, "due_date": s.due_date.isoformat() if s.due_date else None,
        "status": s.status, "created_at": s.created_at.isoformat(),
        "remark": s.remark,
    }


def _allocation_dict(a: Allocation) -> dict:
    return {
        "id": a.id, "purchase_id": a.purchase_id,
        "customer_id": a.customer_id,
        "customer_name": a.customer.name if a.customer else None,
        "customer_stall": a.customer.stall_code if a.customer else None,
        "grade": a.grade, "qty_kg": a.qty_kg, "unit_price": a.unit_price,
        "total_amount": a.total_amount, "status": a.status,
        "allocated_at": a.allocated_at.isoformat(), "operator": a.operator,
        "remark": a.remark,
    }


@router.get("/trace/{purchase_id}", response_model=TraceOut)
def trace(purchase_id: int, db: Session = Depends(get_db),
          _: User = Depends(get_current_user)):
    p = db.query(Purchase).get(purchase_id)
    if not p:
        raise HTTPException(404, "进货单不存在")

    purchase_dict = {
        "id": p.id, "code": p.code,
        "supplier_id": p.supplier_id,
        "supplier_name": p.supplier.name if p.supplier else None,
        "supplier_contact": p.supplier.contact if p.supplier else None,
        "product_id": p.product_id,
        "product_name": p.product.name if p.product else None,
        "gross_kg": p.gross_kg, "tare_kg": p.tare_kg, "net_kg": p.net_kg,
        "unit_price": p.unit_price, "total_amount": p.total_amount,
        "truck_no": p.truck_no, "warehouse_in": p.warehouse_in,
        "purchase_date": p.purchase_date.isoformat(), "operator": p.operator,
        "remark": p.remark,
    }

    gradings = [{
        "id": g.id, "grade": g.grade, "weight_kg": g.weight_kg,
        "ratio": g.ratio, "unit_cost": g.unit_cost, "remark": g.remark,
        "created_at": g.created_at.isoformat(),
    } for g in p.gradings]

    allocations = [_allocation_dict(a) for a in p.allocations]

    # 顺着 allocations 抓 sales 和 payments
    allocation_ids = [a.id for a in p.allocations]
    sales = []
    payments = []
    if allocation_ids:
        sale_rows = db.query(CreditSale).filter(
            CreditSale.allocation_id.in_(allocation_ids)).all()
        for s in sale_rows:
            if s.balance > 0 and s.due_date and s.due_date < datetime.now() and s.status != "逾期":
                s.status = "逾期"
            sales.append(_sale_dict(s))
            sale_payments = db.query(Payment).filter(Payment.sale_id == s.id).all()
            for pay in sale_payments:
                payments.append({
                    "id": pay.id, "sale_id": pay.sale_id, "amount": pay.amount,
                    "method": pay.method, "paid_at": pay.paid_at.isoformat(),
                    "operator": pay.operator, "remark": pay.remark,
                })
        db.commit()

    # 相关异常单（含 purchase / allocation / sale 相关）
    related_exc = []
    exc_p = db.query(ExceptionRecord).filter(
        ExceptionRecord.related_type == "purchase",
        ExceptionRecord.related_id == p.id).all()
    related_exc.extend(exc_p)
    if allocation_ids:
        exc_a = db.query(ExceptionRecord).filter(
            ExceptionRecord.related_type == "allocation",
            ExceptionRecord.related_id.in_(allocation_ids)).all()
        related_exc.extend(exc_a)
    sale_ids = [s["id"] for s in sales]
    if sale_ids:
        exc_s = db.query(ExceptionRecord).filter(
            ExceptionRecord.related_type == "sale",
            ExceptionRecord.related_id.in_(sale_ids)).all()
        related_exc.extend(exc_s)

    exceptions = [{
        "id": e.id, "type": e.type, "related_type": e.related_type,
        "related_id": e.related_id, "title": e.title, "description": e.description,
        "evidence": e.evidence, "amount": e.amount, "status": e.status,
        "handler": e.handler, "created_at": e.created_at.isoformat(),
        "updated_at": e.updated_at.isoformat(), "remark": e.remark,
    } for e in related_exc]

    return TraceOut(
        purchase=purchase_dict,
        gradings=gradings,
        allocations=allocations,
        sales=sales,
        payments=payments,
        exceptions=exceptions,
    )
