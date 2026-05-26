from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import Order, OrderTimeline, ReplacementPart, SampleLending, Arrival
from app.schemas import ReplacementPartCreate

router = APIRouter()


def _add_timeline(db: Session, order_id: int, event_type: str, event_description: str, operator_name: str = "系统"):
    timeline = OrderTimeline(
        order_id=order_id,
        event_type=event_type,
        event_description=event_description,
        operator_name=operator_name,
    )
    db.add(timeline)


@router.get("/{order_id}/after-sales")
def get_after_sales_summary(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    now = datetime.now()
    samples = db.query(SampleLending).filter(SampleLending.order_id == order_id).all()

    unreturned_samples = []
    overdue_samples = []
    lost_samples = []

    for s in samples:
        if s.status == "lost":
            lost_samples.append(s)
        elif s.returned_date is None:
            unreturned_samples.append(s)
            is_overdue = s.status == "overdue" or (s.due_date and s.due_date < now)
            if is_overdue:
                if s.status != "overdue":
                    s.status = "overdue"
                    db.flush()
                overdue_samples.append(s)

    db.commit()

    arrivals = db.query(Arrival).filter(Arrival.order_id == order_id).all()
    damaged_arrivals = [a for a in arrivals if a.damaged_qty > 0]
    missing_arrivals = [a for a in arrivals if a.missing_qty > 0]

    replacements = db.query(ReplacementPart).filter(ReplacementPart.order_id == order_id).all()
    pending_replacements = [r for r in replacements if r.status in ("pending", "ordered")]

    return {
        "order_id": order_id,
        "order_no": order.order_no,
        "customer_name": order.customer_name,
        "unreturned_samples": len(unreturned_samples),
        "overdue_samples": len(overdue_samples),
        "lost_samples": len(lost_samples),
        "damaged_arrivals": len(damaged_arrivals),
        "missing_arrivals": len(missing_arrivals),
        "pending_replacements": len(pending_replacements),
        "timeline": [
            {
                "id": t.id,
                "event_type": t.event_type,
                "event_description": t.event_description,
                "event_time": t.event_time.isoformat() if t.event_time else None,
                "operator_name": t.operator_name,
            }
            for t in sorted(order.timeline, key=lambda x: x.event_time or datetime.min, reverse=True)
        ],
    }


@router.post("/{order_id}/after-sales/raise")
def raise_after_sales(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    old_status = order.status
    order.status = "after_sales"
    order.updated_at = datetime.now()
    _add_timeline(db, order_id, "status_change", f"订单进入售后流程（原状态：{old_status}）")
    db.commit()
    return {"message": "订单已进入售后流程", "order_no": order.order_no}