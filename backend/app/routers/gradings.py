from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.auth import get_current_user
from app.models import User, Grading, Purchase
from app.schemas import GradingIn, GradingOut

router = APIRouter(prefix="/api/gradings", tags=["gradings"])


def _enrich(g: Grading) -> dict:
    return {
        "id": g.id, "purchase_id": g.purchase_id, "grade": g.grade,
        "weight_kg": g.weight_kg, "ratio": g.ratio, "unit_cost": g.unit_cost,
        "remark": g.remark, "created_at": g.created_at,
    }


@router.get("", response_model=list[GradingOut])
def list_gradings(purchase_id: Optional[int] = None,
                  db: Session = Depends(get_db),
                  _: User = Depends(get_current_user)):
    q = db.query(Grading)
    if purchase_id:
        q = q.filter(Grading.purchase_id == purchase_id)
    return [_enrich(g) for g in q.order_by(Grading.created_at.desc()).all()]


@router.post("", response_model=GradingOut)
def create_grading(req: GradingIn, db: Session = Depends(get_db),
                   _: User = Depends(get_current_user)):
    p = db.query(Purchase).get(req.purchase_id)
    if not p:
        raise HTTPException(404, "进货单不存在")
    existing_kg = sum(g.weight_kg for g in p.gradings)
    if existing_kg + req.weight_kg > p.net_kg:
        raise HTTPException(400, f"分级重量超过进货净重（剩余可分级 {p.net_kg - existing_kg:.1f} 斤）")
    ratio = round(req.weight_kg / p.net_kg, 4) if p.net_kg else 0
    g = Grading(
        purchase_id=req.purchase_id,
        grade=req.grade,
        weight_kg=req.weight_kg,
        ratio=ratio,
        unit_cost=p.unit_price,
        remark=req.remark,
        created_at=datetime.now(),
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    return _enrich(g)


@router.delete("/{grading_id}")
def delete_grading(grading_id: int, db: Session = Depends(get_db),
                   _: User = Depends(get_current_user)):
    g = db.query(Grading).get(grading_id)
    if not g:
        raise HTTPException(404, "分级记录不存在")
    db.delete(g)
    db.commit()
    return {"ok": True}
