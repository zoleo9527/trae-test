from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import LoadingCheck, LiftingOrder, User, ExceptionRecord, AuditLog
from schemas import LoadingCheckCreate, LoadingCheckUpdate, LoadingCheckResponse

router = APIRouter(prefix="/api/loading", tags=["loading"])


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


@router.get("", response_model=list[LoadingCheckResponse])
def list_loading(order_id: int = Query(None), status: str = Query(None), db: Session = Depends(get_db)):
    query = db.query(LoadingCheck)
    if order_id:
        query = query.filter(LoadingCheck.order_id == order_id)
    if status:
        query = query.filter(LoadingCheck.status == status)
    return query.all()


@router.post("", response_model=LoadingCheckResponse)
def create_loading(data: LoadingCheckCreate, db: Session = Depends(get_db)):
    order = db.query(LiftingOrder).filter(LiftingOrder.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="排单不存在")
    loading = LoadingCheck(
        order_id=data.order_id,
        checker_id=data.checker_id,
        planned_qty=data.planned_qty,
        actual_qty=data.actual_qty,
        vehicle_no=data.vehicle_no,
        driver_name=data.driver_name,
        status="待装车",
        remark=data.remark
    )
    db.add(loading)
    db.flush()
    write_audit_log(
        db, data.checker_id, "创建装车记录", "loading_check", loading.id,
        f"创建装车复核记录，排单 {order.order_no}，计划数量 {data.planned_qty}"
    )
    db.commit()
    db.refresh(loading)
    return loading


@router.put("/{loading_id}", response_model=LoadingCheckResponse)
def update_loading(loading_id: int, data: LoadingCheckUpdate, db: Session = Depends(get_db)):
    loading = db.query(LoadingCheck).filter(LoadingCheck.id == loading_id).first()
    if not loading:
        raise HTTPException(status_code=404, detail="装车记录不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(loading, key, value)
    db.commit()
    db.refresh(loading)
    return loading


@router.put("/{loading_id}/verify", response_model=LoadingCheckResponse)
def verify_loading(loading_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    loading = db.query(LoadingCheck).filter(LoadingCheck.id == loading_id).first()
    if not loading:
        raise HTTPException(status_code=404, detail="装车记录不存在")
    if loading.actual_qty is None:
        raise HTTPException(status_code=400, detail="请先填写实际数量")
    loading.status = "已复核"
    loading.loaded_at = datetime.utcnow()
    if loading.actual_qty != loading.planned_qty:
        diff = abs(loading.actual_qty - loading.planned_qty)
        exception = ExceptionRecord(
            source_type="装车",
            source_id=loading.id,
            exception_type="数量差异",
            severity="严重" if diff >= 10 else "一般",
            description=f"装车数量差异：计划 {loading.planned_qty} 棵，实际 {loading.actual_qty} 棵，差异 {diff} 棵",
            status="待处理",
            created_at=datetime.utcnow()
        )
        db.add(exception)
        loading.status = "异常"
        write_audit_log(
            db, user_id, "装车复核异常", "loading_check", loading.id,
            f"装车复核发现数量差异，计划 {loading.planned_qty}，实际 {loading.actual_qty}，已创建异常记录"
        )
    else:
        write_audit_log(
            db, user_id, "装车复核通过", "loading_check", loading.id,
            f"装车复核通过，数量 {loading.actual_qty}"
        )
    db.commit()
    db.refresh(loading)
    return loading
