from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import ReplacementPart, OrderTimeline
from app.schemas import ReplacementPartCreate, ReplacementPartUpdate, ReplacementPartResponse

router = APIRouter()


def _add_timeline(db: Session, order_id: int, event_type: str, event_description: str, operator_name: str = "系统"):
    timeline = OrderTimeline(
        order_id=order_id,
        event_type=event_type,
        event_description=event_description,
        operator_name=operator_name,
    )
    db.add(timeline)


@router.get("/{order_id}/replacements", response_model=list[ReplacementPartResponse])
def list_replacements(order_id: int, db: Session = Depends(get_db)):
    replacements = db.query(ReplacementPart).filter(ReplacementPart.order_id == order_id).all()
    return [ReplacementPartResponse.model_validate(r) for r in replacements]


@router.post("/{order_id}/replacements", response_model=ReplacementPartResponse)
def create_replacement(order_id: int, rep_data: ReplacementPartCreate, db: Session = Depends(get_db)):
    replacement = ReplacementPart(
        order_id=order_id,
        item_id=rep_data.item_id,
        part_name=rep_data.part_name,
        part_code=rep_data.part_code,
        quantity=rep_data.quantity,
        reason=rep_data.reason,
        remarks=rep_data.remarks,
        status="pending",
    )
    db.add(replacement)
    db.flush()
    _add_timeline(db, order_id, "replacement_requested", f"申请补件：{rep_data.part_name}×{rep_data.quantity}，原因：{rep_data.reason}")
    db.commit()
    db.refresh(replacement)
    return ReplacementPartResponse.model_validate(replacement)


@router.put("/{order_id}/replacements/{rep_id}", response_model=ReplacementPartResponse)
def update_replacement(order_id: int, rep_id: int, update_data: ReplacementPartUpdate, db: Session = Depends(get_db)):
    replacement = db.query(ReplacementPart).filter(ReplacementPart.id == rep_id, ReplacementPart.order_id == order_id).first()
    if not replacement:
        raise HTTPException(status_code=404, detail="补件记录不存在")

    old_status = replacement.status
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(replacement, field, value)

    if update_data.status:
        if update_data.status == "ordered" and old_status != "ordered":
            replacement.ordered_date = datetime.now()
            _add_timeline(db, order_id, "replacement_ordered", f"补件已下单：{replacement.part_name}")
        elif update_data.status == "arrived" and old_status != "arrived":
            replacement.arrived_date = datetime.now()
            _add_timeline(db, order_id, "replacement_arrived", f"补件已到货：{replacement.part_name}")
        elif update_data.status == "installed" and old_status != "installed":
            replacement.installed_date = datetime.now()
            _add_timeline(db, order_id, "replacement_installed", f"补件已安装：{replacement.part_name}")
        elif update_data.status == "confirmed" and old_status != "confirmed":
            replacement.confirmed_date = datetime.now()
            _add_timeline(db, order_id, "replacement_confirmed", f"补件已确认：{replacement.part_name}")
        elif update_data.status == "rejected":
            _add_timeline(db, order_id, "replacement_rejected", f"补件申请被拒绝")

    db.commit()
    db.refresh(replacement)
    return ReplacementPartResponse.model_validate(replacement)


@router.delete("/{order_id}/replacements/{rep_id}")
def delete_replacement(order_id: int, rep_id: int, db: Session = Depends(get_db)):
    replacement = db.query(ReplacementPart).filter(ReplacementPart.id == rep_id, ReplacementPart.order_id == order_id).first()
    if not replacement:
        raise HTTPException(status_code=404, detail="补件记录不存在")
    db.delete(replacement)
    db.commit()
    return {"message": "补件记录已删除"}