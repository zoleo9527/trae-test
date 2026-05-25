from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.auth import get_current_user
from app.models import User, Purchase, Supplier, Product
from app.schemas import PurchaseIn, PurchaseOut

router = APIRouter(prefix="/api/purchases", tags=["purchases"])


def _enrich(p: Purchase) -> dict:
    graded_kg = sum(g.weight_kg for g in p.gradings if g.grade != "损耗") or 0
    loss_kg = sum(g.weight_kg for g in p.gradings if g.grade == "损耗") or 0
    allocated_kg = sum(a.qty_kg for a in p.allocations) or 0
    return {
        "id": p.id, "code": p.code,
        "supplier_id": p.supplier_id,
        "supplier_name": p.supplier.name if p.supplier else None,
        "supplier_contact": p.supplier.contact if p.supplier else None,
        "supplier_region": p.supplier.region if p.supplier else None,
        "product_id": p.product_id, "product_name": p.product.name if p.product else None,
        "gross_kg": p.gross_kg, "tare_kg": p.tare_kg, "net_kg": p.net_kg,
        "unit_price": p.unit_price, "total_amount": p.total_amount,
        "truck_no": p.truck_no, "warehouse_in": p.warehouse_in,
        "purchase_date": p.purchase_date, "operator": p.operator, "remark": p.remark,
        "graded_kg": graded_kg, "allocated_kg": allocated_kg, "loss_kg": loss_kg,
    }


@router.get("", response_model=list[PurchaseOut])
def list_purchases(
    keyword: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Purchase).join(Supplier).join(Product)
    if keyword:
        like = f"%{keyword}%"
        q = q.filter((Purchase.code.like(like)) | (Supplier.name.like(like)) | (Product.name.like(like)))
    items = q.order_by(Purchase.purchase_date.desc()).all()
    out = []
    for p in items:
        data = _enrich(p)
        if status == "ungraded" and data["graded_kg"] > 0:
            continue
        if status == "unallocated" and data["graded_kg"] - data["allocated_kg"] <= 0:
            continue
        if status == "loss" and data["loss_kg"] == 0:
            continue
        out.append(data)
    return out


@router.get("/{purchase_id}", response_model=PurchaseOut)
def get_purchase(purchase_id: int, db: Session = Depends(get_db),
                 _: User = Depends(get_current_user)):
    p = db.query(Purchase).get(purchase_id)
    if not p:
        raise HTTPException(404, "进货单不存在")
    return _enrich(p)


@router.post("", response_model=PurchaseOut)
def create_purchase(req: PurchaseIn, db: Session = Depends(get_db),
                    current: User = Depends(get_current_user)):
    net = req.gross_kg - req.tare_kg
    today = datetime.now()
    code = "CG" + today.strftime("%Y%m%d") + "-" + str(db.query(Purchase).count() + 1).zfill(3)
    p = Purchase(
        code=code,
        supplier_id=req.supplier_id,
        product_id=req.product_id,
        gross_kg=req.gross_kg,
        tare_kg=req.tare_kg,
        net_kg=net,
        unit_price=req.unit_price,
        total_amount=net * req.unit_price,
        truck_no=req.truck_no,
        warehouse_in=req.warehouse_in or "未入库",
        purchase_date=today,
        operator=current.name,
        remark=req.remark,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return _enrich(p)
