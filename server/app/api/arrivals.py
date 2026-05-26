from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Arrival, OrderItem, OrderTimeline
from app.schemas import ArrivalCreate, ArrivalUpdate, ArrivalResponse

router = APIRouter()


def _add_timeline(db: Session, order_id: int, event_type: str, event_description: str, operator_name: str = "系统"):
    timeline = OrderTimeline(
        order_id=order_id,
        event_type=event_type,
        event_description=event_description,
        operator_name=operator_name,
    )
    db.add(timeline)


@router.get("/{order_id}/arrivals", response_model=list[ArrivalResponse])
def list_arrivals(order_id: int, db: Session = Depends(get_db)):
    arrivals = db.query(Arrival).filter(Arrival.order_id == order_id).all()
    return [ArrivalResponse.model_validate(a) for a in arrivals]


@router.post("/{order_id}/arrivals", response_model=ArrivalResponse)
def create_arrival(order_id: int, arrival_data: ArrivalCreate, db: Session = Depends(get_db)):
    arrival = Arrival(
        order_id=order_id,
        item_id=arrival_data.item_id,
        arrival_date=arrival_data.arrival_date,
        quantity=arrival_data.quantity,
        tracking_no=arrival_data.tracking_no,
        warehouse_location=arrival_data.warehouse_location,
        remarks=arrival_data.remarks,
        is_partial=arrival_data.is_partial,
        damaged_qty=arrival_data.damaged_qty,
        missing_qty=arrival_data.missing_qty,
    )
    if arrival_data.damaged_qty > 0:
        arrival.status = "damaged"
    elif arrival_data.is_partial:
        arrival.status = "partial"
    else:
        arrival.status = "arrived"

    db.add(arrival)
    db.flush()

    item = db.query(OrderItem).filter(OrderItem.id == arrival_data.item_id).first()
    item_name = item.product_name if item else "商品"
    if arrival_data.damaged_qty > 0:
        _add_timeline(db, order_id, "arrival_damaged", f"{item_name}到货，{arrival_data.damaged_qty}件损坏")
    elif arrival_data.missing_qty > 0:
        _add_timeline(db, order_id, "arrival_missing", f"{item_name}到货，缺{arrival_data.missing_qty}件")
    elif arrival_data.is_partial:
        _add_timeline(db, order_id, "arrival_partial", f"{item_name}部分到货（{arrival_data.quantity}件）")
    else:
        _add_timeline(db, order_id, "arrival", f"{item_name}到货，入库{arrival_data.warehouse_location or '仓库'}")

    db.commit()
    db.refresh(arrival)
    return ArrivalResponse.model_validate(arrival)


@router.put("/{order_id}/arrivals/{arrival_id}", response_model=ArrivalResponse)
def update_arrival(order_id: int, arrival_id: int, update_data: ArrivalUpdate, db: Session = Depends(get_db)):
    arrival = db.query(Arrival).filter(Arrival.id == arrival_id, Arrival.order_id == order_id).first()
    if not arrival:
        raise HTTPException(status_code=404, detail="到货记录不存在")
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(arrival, field, value)
    db.commit()
    db.refresh(arrival)
    return ArrivalResponse.model_validate(arrival)


@router.delete("/{order_id}/arrivals/{arrival_id}")
def delete_arrival(order_id: int, arrival_id: int, db: Session = Depends(get_db)):
    arrival = db.query(Arrival).filter(Arrival.id == arrival_id, Arrival.order_id == order_id).first()
    if not arrival:
        raise HTTPException(status_code=404, detail="到货记录不存在")
    db.delete(arrival)
    db.commit()
    return {"message": "到货记录已删除"}