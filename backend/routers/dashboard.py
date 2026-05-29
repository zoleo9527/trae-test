from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Plot, LiftingOrder, LoadingCheck, ExceptionRecord
from schemas import DashboardStats, ExceptionRecordResponse

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    total_plots = db.query(Plot).count()
    total_orders = db.query(LiftingOrder).count()
    total_loading = db.query(LoadingCheck).count()
    total_exceptions = db.query(ExceptionRecord).count()

    orders_by_status_rows = db.query(LiftingOrder.status, func.count(LiftingOrder.id)).group_by(LiftingOrder.status).all()
    orders_by_status = {row[0]: row[1] for row in orders_by_status_rows}

    exceptions_by_severity_rows = db.query(ExceptionRecord.severity, func.count(ExceptionRecord.id)).group_by(ExceptionRecord.severity).all()
    exceptions_by_severity = {row[0]: row[1] for row in exceptions_by_severity_rows}

    loading_by_status_rows = db.query(LoadingCheck.status, func.count(LoadingCheck.id)).group_by(LoadingCheck.status).all()
    loading_by_status = {row[0]: row[1] for row in loading_by_status_rows}

    return DashboardStats(
        total_plots=total_plots,
        total_orders=total_orders,
        total_loading=total_loading,
        total_exceptions=total_exceptions,
        orders_by_status=orders_by_status,
        exceptions_by_severity=exceptions_by_severity,
        loading_by_status=loading_by_status
    )


@router.get("/recent-exceptions", response_model=list[ExceptionRecordResponse])
def get_recent_exceptions(db: Session = Depends(get_db)):
    return db.query(ExceptionRecord).order_by(ExceptionRecord.created_at.desc()).limit(10).all()


@router.get("/pending-actions")
def get_pending_actions(db: Session = Depends(get_db)):
    pending_orders = db.query(LiftingOrder).filter(LiftingOrder.status.in_(["待确认", "已确认", "起苗中"])).all()
    pending_exceptions = db.query(ExceptionRecord).filter(ExceptionRecord.status.in_(["待处理", "处理中"])).all()
    pending_loading = db.query(LoadingCheck).filter(LoadingCheck.status.in_(["待装车", "装车中"])).all()

    actions = []
    for order in pending_orders:
        actions.append({
            "type": "排单",
            "id": order.id,
            "title": f"排单 {order.order_no} 待处理",
            "status": order.status,
            "created_at": order.planned_date.isoformat() if order.planned_date else None
        })
    for exc in pending_exceptions:
        actions.append({
            "type": "异常",
            "id": exc.id,
            "title": f"{exc.severity}-{exc.exception_type}: {exc.description[:30]}",
            "status": exc.status,
            "created_at": exc.created_at.isoformat() if exc.created_at else None
        })
    for load in pending_loading:
        actions.append({
            "type": "装车",
            "id": load.id,
            "title": f"装车记录 #{load.id} 待处理",
            "status": load.status,
            "created_at": None
        })

    actions.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return actions
