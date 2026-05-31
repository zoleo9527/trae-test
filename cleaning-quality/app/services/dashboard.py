from datetime import datetime
from sqlalchemy.orm import Session
from app.models.rectification import Rectification
from app.models.inspection import Inspection
from app.models.consumable import Consumable, ConsumableOrder
from app.models.contract import Contract
from app.models.project import Project
from app.schemas.dashboard import DashboardStats, DashboardItem, DashboardResponse
from app.services.schedule import count_missed_check_ins
from app.services.contract import count_expiring_soon
from app.services.rectification import mark_overdue_rectifications


def get_dashboard(db: Session) -> DashboardResponse:
    mark_overdue_rectifications(db)

    pending_rects = db.query(Rectification).filter(Rectification.status == "pending").count()
    overdue_rects = db.query(Rectification).filter(Rectification.status == "overdue").count()
    rejected_rects = db.query(Rectification).filter(Rectification.status == "rejected").count()

    pending_inspections = db.query(Inspection).filter(Inspection.status == "pending").count()
    in_progress_inspections = db.query(Inspection).filter(Inspection.status == "in_progress").count()

    low_stock = db.query(Consumable).filter(Consumable.status.in_(["low", "reorder", "critical"])).count()
    pending_orders = db.query(ConsumableOrder).filter(ConsumableOrder.status == "pending").count()

    expiring = count_expiring_soon(db)

    missed_checkins = count_missed_check_ins(db)

    stats = DashboardStats(
        pending_rectifications=pending_rects,
        overdue_rectifications=overdue_rects,
        rejected_rectifications=rejected_rects,
        pending_inspections=pending_inspections,
        in_progress_inspections=in_progress_inspections,
        low_stock_consumables=low_stock,
        pending_consumable_orders=pending_orders,
        contracts_expiring_soon=expiring,
        missed_check_ins_today=missed_checkins,
    )

    project_map = {p.id: p.name for p in db.query(Project).all()}

    pending_items = _build_pending_items(db, project_map)
    rejected_items = _build_rejected_items(db, project_map)
    review_items = _build_review_items(db, project_map)

    return DashboardResponse(
        stats=stats,
        pending_items=pending_items,
        rejected_items=rejected_items,
        review_items=review_items,
    )


def _build_pending_items(db: Session, project_map: dict) -> list[DashboardItem]:
    items = []
    rects = db.query(Rectification).filter(
        Rectification.status.in_(["pending", "assigned", "overdue"])
    ).order_by(Rectification.deadline.asc().nulls_last()).limit(10).all()
    for r in rects:
        items.append(DashboardItem(
            id=r.id,
            title=r.issue_description[:60],
            subtitle=f"负责人: {r.assignee_name or '未分配'}",
            status=r.status,
            deadline=r.deadline,
            entity_type="rectification",
            project_name=project_map.get(r.project_id),
        ))
    insps = db.query(Inspection).filter(
        Inspection.status == "pending"
    ).order_by(Inspection.scheduled_at.asc().nulls_last()).limit(5).all()
    for i in insps:
        items.append(DashboardItem(
            id=i.id,
            title=f"质检-{i.type}",
            subtitle=f"检查员: {i.inspector_name}",
            status=i.status,
            deadline=i.scheduled_at,
            entity_type="inspection",
            project_name=project_map.get(i.project_id),
        ))
    return items


def _build_rejected_items(db: Session, project_map: dict) -> list[DashboardItem]:
    items = []
    rects = db.query(Rectification).filter(
        Rectification.status == "rejected"
    ).order_by(Rectification.reviewed_at.desc()).limit(10).all()
    for r in rects:
        items.append(DashboardItem(
            id=r.id,
            title=r.issue_description[:60],
            subtitle=f"驳回原因: {(r.reject_reason or '')[:40]}",
            status=r.status,
            deadline=r.deadline,
            entity_type="rectification",
            project_name=project_map.get(r.project_id),
        ))
    return items


def _build_review_items(db: Session, project_map: dict) -> list[DashboardItem]:
    items = []
    rects = db.query(Rectification).filter(
        Rectification.status == "submitted"
    ).order_by(Rectification.submitted_at.asc()).limit(10).all()
    for r in rects:
        items.append(DashboardItem(
            id=r.id,
            title=r.issue_description[:60],
            subtitle=f"整改人: {r.assignee_name}",
            status=r.status,
            deadline=r.deadline,
            entity_type="rectification",
            project_name=project_map.get(r.project_id),
        ))
    orders = db.query(ConsumableOrder).filter(
        ConsumableOrder.status == "pending"
    ).order_by(ConsumableOrder.created_at.asc()).limit(5).all()
    for o in orders:
        c = db.query(Consumable).filter(Consumable.id == o.consumable_id).first()
        name = c.name if c else "未知耗材"
        items.append(DashboardItem(
            id=o.id,
            title=f"补货申请: {name}",
            subtitle=f"数量: {o.quantity}，申请人: {o.requester_name}",
            status=o.status,
            entity_type="consumable_order",
            project_name=project_map.get(o.project_id),
        ))
    return items
