from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import LiftingOrder, Plot, User, AuditLog, ExceptionRecord
from schemas import LiftingOrderCreate, LiftingOrderUpdate, LiftingOrderResponse, ExceptionReport, ExceptionRecordResponse

router = APIRouter(prefix="/api/orders", tags=["orders"])


def write_audit_log(db: Session, user_id: int, action: str, target_type: str, target_id: int, detail: str):
    log = AuditLog(
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        detail=detail,
        created_at=datetime.utcnow()
    )
    db.add(log)


def generate_order_no(db: Session) -> str:
    today_str = datetime.utcnow().strftime("%Y%m%d")
    prefix = f"QM{today_str}"
    count = db.query(LiftingOrder).filter(LiftingOrder.order_no.like(f"{prefix}%")).count()
    return f"{prefix}{str(count + 1).zfill(3)}"


@router.get("", response_model=list[LiftingOrderResponse])
def list_orders(status: str = Query(None), db: Session = Depends(get_db)):
    query = db.query(LiftingOrder)
    if status:
        query = query.filter(LiftingOrder.status == status)
    orders = query.all()
    return orders


@router.post("", response_model=LiftingOrderResponse)
def create_order(data: LiftingOrderCreate, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == data.plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="地块不存在")
    if plot.status == "已起苗":
        raise HTTPException(status_code=400, detail="地块已起苗，无法排单")
    if plot.available_count < data.requested_count:
        raise HTTPException(status_code=400, detail=f"地块可用数量不足，当前可用 {plot.available_count} 株")
    existing_order = db.query(LiftingOrder).filter(
        LiftingOrder.plot_id == data.plot_id,
        LiftingOrder.status != "已完成"
    ).first()
    if existing_order:
        raise HTTPException(status_code=400, detail="该地块已有未完成的排单")
    order_no = generate_order_no(db)
    order = LiftingOrder(
        order_no=order_no,
        plot_id=data.plot_id,
        seedling_type=data.seedling_type,
        requested_count=data.requested_count,
        requester_id=data.requester_id,
        assignee_id=data.assignee_id,
        status="待确认",
        planned_date=data.planned_date,
        remark=data.remark
    )
    db.add(order)
    db.flush()
    plot.available_count -= data.requested_count
    plot.status = "已排单"
    write_audit_log(
        db, data.requester_id, "创建排单", "lifting_order", order.id,
        f"创建排单 {order_no}，地块 {plot.plot_code}，数量 {data.requested_count}，地块可用数量剩余 {plot.available_count}"
    )
    write_audit_log(
        db, data.requester_id, "更新地块", "plot", plot.id,
        f"排单占用地块 {plot.plot_code}，扣减数量 {data.requested_count}，剩余可用 {plot.available_count}，状态更新为已排单"
    )
    db.commit()
    db.refresh(order)
    return order


@router.put("/{order_id}", response_model=LiftingOrderResponse)
def update_order(order_id: int, data: LiftingOrderUpdate, db: Session = Depends(get_db)):
    order = db.query(LiftingOrder).filter(LiftingOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="排单不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(order, key, value)
    db.commit()
    db.refresh(order)
    return order


@router.put("/{order_id}/confirm", response_model=LiftingOrderResponse)
def confirm_order(order_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    order = db.query(LiftingOrder).filter(LiftingOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="排单不存在")
    if order.status != "待确认":
        raise HTTPException(status_code=400, detail="当前状态不允许确认")
    order.status = "已确认"
    write_audit_log(
        db, user_id, "确认排单", "lifting_order", order.id,
        f"确认排单 {order.order_no}"
    )
    db.commit()
    db.refresh(order)
    return order


@router.put("/{order_id}/start", response_model=LiftingOrderResponse)
def start_lifting(order_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    order = db.query(LiftingOrder).filter(LiftingOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="排单不存在")
    if order.status != "已确认":
        raise HTTPException(status_code=400, detail="当前状态不允许开始起苗")
    order.status = "起苗中"
    write_audit_log(
        db, user_id, "开始起苗", "lifting_order", order.id,
        f"开始起苗 {order.order_no}"
    )
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/report-exception", response_model=ExceptionRecordResponse)
def report_exception(order_id: int, data: ExceptionReport, user_id: int = Query(...), db: Session = Depends(get_db)):
    order = db.query(LiftingOrder).filter(LiftingOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="排单不存在")
    if order.status not in ["已确认", "起苗中"]:
        raise HTTPException(status_code=400, detail="当前状态不允许上报异常")
    exception_record = ExceptionRecord(
        source_type="起苗",
        source_id=order.id,
        exception_type=data.exception_type,
        severity=data.severity,
        description=data.description
    )
    db.add(exception_record)
    db.flush()
    order.status = "异常"
    write_audit_log(
        db, user_id, "起苗异常", "lifting_order", order.id,
        f"排单 {order.order_no} 上报异常：{data.exception_type}-{data.severity}，{data.description}"
    )
    write_audit_log(
        db, user_id, "创建异常记录", "exception_record", exception_record.id,
        f"起苗异常记录，排单 {order.order_no}，类型 {data.exception_type}，严重程度 {data.severity}"
    )
    db.commit()
    db.refresh(exception_record)
    return exception_record


@router.put("/{order_id}/complete", response_model=LiftingOrderResponse)
def complete_order(order_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    order = db.query(LiftingOrder).filter(LiftingOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="排单不存在")
    if order.status != "起苗中":
        raise HTTPException(status_code=400, detail="当前状态不允许完成")
    order.status = "已完成"
    order.completed_at = datetime.utcnow()
    plot = db.query(Plot).filter(Plot.id == order.plot_id).first()
    if plot and plot.available_count <= 0:
        plot.status = "已起苗"
    write_audit_log(
        db, user_id, "完成起苗", "lifting_order", order.id,
        f"完成起苗 {order.order_no}，数量 {order.requested_count}"
    )
    if plot and plot.available_count <= 0:
        write_audit_log(
            db, user_id, "更新地块", "plot", plot.id,
            f"地块 {plot.plot_code} 可用数量为 0，状态更新为已起苗"
        )
    db.commit()
    db.refresh(order)
    return order
