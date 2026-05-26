from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import SampleLending, OrderTimeline
from app.schemas import SampleLendingCreate, SampleLendingUpdate, SampleLendingResponse

router = APIRouter()


def _add_timeline(db: Session, order_id: int, event_type: str, event_description: str, operator_name: str = "系统"):
    timeline = OrderTimeline(
        order_id=order_id,
        event_type=event_type,
        event_description=event_description,
        operator_name=operator_name,
    )
    db.add(timeline)


@router.get("/{order_id}/samples", response_model=list[SampleLendingResponse])
def list_samples(order_id: int, db: Session = Depends(get_db)):
    samples = db.query(SampleLending).filter(SampleLending.order_id == order_id).all()
    return [SampleLendingResponse.model_validate(s) for s in samples]


@router.post("/{order_id}/samples", response_model=SampleLendingResponse)
def create_sample(order_id: int, sample_data: SampleLendingCreate, db: Session = Depends(get_db)):
    sample = SampleLending(
        order_id=order_id,
        sample_name=sample_data.sample_name,
        sample_code=sample_data.sample_code,
        lent_to=sample_data.lent_to,
        due_date=sample_data.due_date,
        remarks=sample_data.remarks,
        status="lent",
    )
    db.add(sample)
    db.flush()
    _add_timeline(db, order_id, "sample_lent", f"借出样品：{sample.sample_name}，借给{sample.lent_to}，应还日期{sample.due_date.strftime('%Y-%m-%d')}")
    db.commit()
    db.refresh(sample)
    return SampleLendingResponse.model_validate(sample)


@router.put("/{order_id}/samples/{sample_id}", response_model=SampleLendingResponse)
def update_sample(order_id: int, sample_id: int, update_data: SampleLendingUpdate, db: Session = Depends(get_db)):
    sample = db.query(SampleLending).filter(SampleLending.id == sample_id, SampleLending.order_id == order_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail="样品借出记录不存在")

    old_status = sample.status
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(sample, field, value)

    if update_data.status == "returned" and old_status != "returned":
        sample.returned_date = datetime.now()
        condition = update_data.condition or sample.condition or "未说明"
        _add_timeline(db, order_id, "sample_returned", f"样品归还：{sample.sample_name}，状态：{condition}")
    elif update_data.status == "lost":
        _add_timeline(db, order_id, "sample_lost", f"样品丢失：{sample.sample_name}")
    elif update_data.status == "overdue":
        _add_timeline(db, order_id, "sample_overdue", f"样品超期未归还：{sample.sample_name}")

    db.commit()
    db.refresh(sample)
    return SampleLendingResponse.model_validate(sample)


@router.delete("/{order_id}/samples/{sample_id}")
def delete_sample(order_id: int, sample_id: int, db: Session = Depends(get_db)):
    sample = db.query(SampleLending).filter(SampleLending.id == sample_id, SampleLending.order_id == order_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail="样品借出记录不存在")
    db.delete(sample)
    db.commit()
    return {"message": "样品借出记录已删除"}