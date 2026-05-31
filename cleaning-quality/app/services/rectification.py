from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.rectification import Rectification
from app.schemas.rectification import RectificationCreate, RectificationAssign, RectificationSubmit, RectificationReview
from app.services.audit import log_audit
from app.services.state_machine import (
    validate_rectification_transition,
    check_rectification_overdue,
)


def get_rectifications(
    db: Session,
    project_id: Optional[int] = None,
    inspection_id: Optional[int] = None,
    status: Optional[str] = None,
    assignee_id: Optional[str] = None,
) -> list[Rectification]:
    q = db.query(Rectification)
    if project_id is not None:
        q = q.filter(Rectification.project_id == project_id)
    if inspection_id is not None:
        q = q.filter(Rectification.inspection_id == inspection_id)
    if status is not None:
        q = q.filter(Rectification.status == status)
    if assignee_id is not None:
        q = q.filter(Rectification.assignee_id == assignee_id)
    return q.order_by(Rectification.created_at.desc()).all()


def get_rectification(db: Session, rectification_id: int) -> Optional[Rectification]:
    return db.query(Rectification).filter(Rectification.id == rectification_id).first()


def create_rectification(db: Session, data: RectificationCreate, operator_id: str, operator_name: str, operator_role: str) -> Rectification:
    rect = Rectification(**data.model_dump())
    db.add(rect)
    db.flush()
    log_audit(
        db, "rectification", rect.id, "create",
        operator_id, operator_name, operator_role,
        new_values=data.model_dump(),
        detail=f"关联质检ID={data.inspection_id}",
    )
    db.commit()
    db.refresh(rect)
    return rect


def assign_rectification(db: Session, rectification_id: int, data: RectificationAssign, operator_id: str, operator_name: str, operator_role: str) -> Optional[Rectification]:
    rect = get_rectification(db, rectification_id)
    if not rect:
        return None
    validate_rectification_transition(rect.status, "assigned")
    old_values = {"status": rect.status, "assignee_id": rect.assignee_id}
    rect.status = "assigned"
    rect.assignee_id = data.assignee_id
    rect.assignee_name = data.assignee_name
    rect.deadline = data.deadline or rect.deadline
    log_audit(
        db, "rectification", rect.id, "assign",
        operator_id, operator_name, operator_role,
        old_values=old_values,
        new_values={"status": "assigned", "assignee_id": data.assignee_id, "assignee_name": data.assignee_name},
    )
    db.commit()
    db.refresh(rect)
    return rect


def start_rectification(db: Session, rectification_id: int, operator_id: str, operator_name: str, operator_role: str) -> Optional[Rectification]:
    rect = get_rectification(db, rectification_id)
    if not rect:
        return None
    validate_rectification_transition(rect.status, "in_progress")
    old_status = rect.status
    rect.status = "in_progress"
    log_audit(
        db, "rectification", rect.id, "start",
        operator_id, operator_name, operator_role,
        old_values={"status": old_status},
        new_values={"status": "in_progress"},
    )
    db.commit()
    db.refresh(rect)
    return rect


def submit_rectification(db: Session, rectification_id: int, data: RectificationSubmit, operator_id: str, operator_name: str, operator_role: str) -> Optional[Rectification]:
    rect = get_rectification(db, rectification_id)
    if not rect:
        return None
    validate_rectification_transition(rect.status, "submitted")
    old_status = rect.status
    rect.status = "submitted"
    rect.resolution = data.resolution
    rect.resolution_photos = data.resolution_photos
    rect.submitted_at = datetime.utcnow()
    log_audit(
        db, "rectification", rect.id, "submit",
        operator_id, operator_name, operator_role,
        old_values={"status": old_status},
        new_values={"status": "submitted", "resolution": data.resolution},
    )
    db.commit()
    db.refresh(rect)
    return rect


def review_rectification(db: Session, rectification_id: int, data: RectificationReview, operator_id: str, operator_name: str, operator_role: str) -> Optional[Rectification]:
    rect = get_rectification(db, rectification_id)
    if not rect:
        return None
    if rect.status != "submitted":
        raise ValueError(f"整改单状态为 {rect.status}，只有 submitted 状态才可审核")
    target = data.action
    if target not in ("approved", "rejected"):
        raise ValueError(f"审核动作只允许 approved 或 rejected，收到 {target}")
    validate_rectification_transition(rect.status, target)
    old_status = rect.status
    rect.status = target
    rect.reviewed_at = datetime.utcnow()
    if target == "rejected":
        rect.reject_reason = data.reject_reason
    else:
        rect.completed_at = datetime.utcnow()
    log_audit(
        db, "rectification", rect.id, f"review_{target}",
        operator_id, operator_name, operator_role,
        old_values={"status": old_status},
        new_values={"status": target, "reject_reason": data.reject_reason},
    )
    db.commit()
    db.refresh(rect)
    return rect


def mark_overdue_rectifications(db: Session) -> list[Rectification]:
    now = datetime.utcnow()
    rects = db.query(Rectification).filter(
        Rectification.status.in_(["pending", "assigned", "in_progress"])
    ).all()
    overdue = []
    for rect in rects:
        if check_rectification_overdue(rect, now):
            old_status = rect.status
            rect.status = "overdue"
            log_audit(
                db, "rectification", rect.id, "auto_overdue",
                "system", "系统", "system",
                old_values={"status": old_status},
                new_values={"status": "overdue"},
                detail=f"超过截止时间 {rect.deadline}",
            )
            overdue.append(rect)
    if overdue:
        db.commit()
    return overdue
