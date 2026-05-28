from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.database import get_db
from app import models, schemas
from app.auth import get_current_active_user, requires_roles

PAYMENT_ROLES = {models.UserRole.ADMIN, models.UserRole.AGENT_MANAGER, models.UserRole.FINANCE}
CREW_ROLES = {models.UserRole.ADMIN, models.UserRole.AGENT_MANAGER, models.UserRole.SITE_COORDINATOR, models.UserRole.DOCUMENT_SPECIALIST}

router = APIRouter(prefix="/dashboard", tags=["首页数据"])


@router.get("/", response_model=schemas.DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.SITE_COORDINATOR,
        models.UserRole.DOCUMENT_SPECIALIST,
        models.UserRole.FINANCE
    ))
):
    now = datetime.now()
    can_see_payments = current_user.role in PAYMENT_ROLES
    can_see_crew = current_user.role in CREW_ROLES

    pending_checkpoints = db.query(models.CheckpointReminder).filter(
        models.CheckpointReminder.status == models.TaskStatus.PENDING
    ).count()

    pending_berths = db.query(models.BerthPlan).filter(
        models.BerthPlan.status == models.TaskStatus.PENDING
    ).count()

    pending_tasks = pending_checkpoints + pending_berths
    if can_see_crew:
        pending_crew = db.query(models.CrewChange).filter(
            models.CrewChange.status == models.TaskStatus.PENDING
        ).count()
        pending_tasks += pending_crew

    rejected_items = db.query(models.CheckpointReminder).filter(
        models.CheckpointReminder.status == models.TaskStatus.REJECTED
    ).count()

    rejected_berths = db.query(models.BerthPlan).filter(
        models.BerthPlan.status == models.TaskStatus.REJECTED
    ).count()

    rejected_total = rejected_items + rejected_berths
    if can_see_crew:
        rejected_crew = db.query(models.CrewChange).filter(
            models.CrewChange.status == models.TaskStatus.REJECTED
        ).count()
        rejected_total += rejected_crew

    need_review = db.query(models.CheckpointReminder).filter(
        models.CheckpointReminder.status == models.TaskStatus.NEEDS_REVIEW
    ).count()

    need_review_berths = db.query(models.BerthPlan).filter(
        models.BerthPlan.status == models.TaskStatus.NEEDS_REVIEW
    ).count()

    need_review_total = need_review + need_review_berths
    if can_see_crew:
        need_review_crew = db.query(models.CrewChange).filter(
            models.CrewChange.status == models.TaskStatus.NEEDS_REVIEW
        ).count()
        need_review_total += need_review_crew

    overdue_checkpoints = db.query(models.CheckpointReminder).filter(
        and_(
            models.CheckpointReminder.due_date < now,
            models.CheckpointReminder.status != models.TaskStatus.COMPLETED
        )
    ).count()

    pending_payments = None
    overdue_payments = None
    if can_see_payments:
        pending_payments = db.query(models.AdvancePayment).filter(
            models.AdvancePayment.payment_status == models.PaymentStatus.UNPAID
        ).count()
        overdue_payments = db.query(models.AdvancePayment).filter(
            models.AdvancePayment.reimbursement_status == models.PaymentStatus.OVERDUE
        ).count()

    total_crew_changes = None
    if can_see_crew:
        total_crew_changes = db.query(models.CrewChange).count()

    active_berths = db.query(models.BerthPlan).filter(
        models.BerthPlan.status.in_([
            models.TaskStatus.PENDING,
            models.TaskStatus.IN_PROGRESS
        ])
    ).count()

    pending_items = []

    checkpoints = db.query(models.CheckpointReminder).filter(
        models.CheckpointReminder.status == models.TaskStatus.PENDING
    ).order_by(models.CheckpointReminder.due_date.asc()).limit(10).all()

    for cp in checkpoints:
        assignee_name = cp.assignee.full_name if cp.assignee else None
        pending_items.append(schemas.DashboardItem(
            id=cp.id,
            type="checkpoint",
            title=cp.title,
            status=cp.status,
            due_date=cp.due_date,
            assigned_to=assignee_name,
            priority=cp.priority,
            created_at=cp.created_at
        ))

    berths = db.query(models.BerthPlan).filter(
        models.BerthPlan.status == models.TaskStatus.PENDING
    ).order_by(models.BerthPlan.eta.asc()).limit(5).all()

    for b in berths:
        pending_items.append(schemas.DashboardItem(
            id=b.id,
            type="berth",
            title=f"{b.vessel_name} - {b.port}",
            status=b.status,
            due_date=b.eta,
            assigned_to=b.creator.full_name if b.creator else None,
            created_at=b.created_at
        ))

    if can_see_crew:
        crew_changes = db.query(models.CrewChange).filter(
            models.CrewChange.status == models.TaskStatus.PENDING
        ).order_by(models.CrewChange.created_at.desc()).limit(5).all()

        for c in crew_changes:
            pending_items.append(schemas.DashboardItem(
                id=c.id,
                type="crew",
                title=f"{c.crew_name} - {c.change_type.value}",
                status=c.status,
                assigned_to=c.creator.full_name if c.creator else None,
                created_at=c.created_at
            ))

    rejected_items_list = []

    rejected_cp = db.query(models.CheckpointReminder).filter(
        models.CheckpointReminder.status == models.TaskStatus.REJECTED
    ).order_by(models.CheckpointReminder.updated_at.desc()).limit(10).all()

    for cp in rejected_cp:
        assignee_name = cp.assignee.full_name if cp.assignee else None
        rejected_items_list.append(schemas.DashboardItem(
            id=cp.id,
            type="checkpoint",
            title=cp.title,
            status=cp.status,
            due_date=cp.due_date,
            assigned_to=assignee_name,
            priority=cp.priority,
            created_at=cp.created_at
        ))

    rejected_br = db.query(models.BerthPlan).filter(
        models.BerthPlan.status == models.TaskStatus.REJECTED
    ).order_by(models.BerthPlan.updated_at.desc()).limit(5).all()

    for b in rejected_br:
        rejected_items_list.append(schemas.DashboardItem(
            id=b.id,
            type="berth",
            title=f"{b.vessel_name} - {b.port}",
            status=b.status,
            due_date=b.eta,
            assigned_to=b.creator.full_name if b.creator else None,
            created_at=b.created_at
        ))

    if can_see_crew:
        rejected_crew_list = db.query(models.CrewChange).filter(
            models.CrewChange.status == models.TaskStatus.REJECTED
        ).order_by(models.CrewChange.updated_at.desc()).limit(5).all()

        for c in rejected_crew_list:
            rejected_items_list.append(schemas.DashboardItem(
                id=c.id,
                type="crew",
                title=f"{c.crew_name} - {c.change_type.value}",
                status=c.status,
                assigned_to=c.creator.full_name if c.creator else None,
                created_at=c.created_at
            ))

    need_review_list = []

    review_cp = db.query(models.CheckpointReminder).filter(
        models.CheckpointReminder.status == models.TaskStatus.NEEDS_REVIEW
    ).order_by(models.CheckpointReminder.due_date.asc()).limit(10).all()

    for cp in review_cp:
        assignee_name = cp.assignee.full_name if cp.assignee else None
        need_review_list.append(schemas.DashboardItem(
            id=cp.id,
            type="checkpoint",
            title=cp.title,
            status=cp.status,
            due_date=cp.due_date,
            assigned_to=assignee_name,
            priority=cp.priority,
            created_at=cp.created_at
        ))

    review_br = db.query(models.BerthPlan).filter(
        models.BerthPlan.status == models.TaskStatus.NEEDS_REVIEW
    ).order_by(models.BerthPlan.updated_at.desc()).limit(5).all()

    for b in review_br:
        need_review_list.append(schemas.DashboardItem(
            id=b.id,
            type="berth",
            title=f"{b.vessel_name} - {b.port}",
            status=b.status,
            due_date=b.eta,
            assigned_to=b.creator.full_name if b.creator else None,
            created_at=b.created_at
        ))

    if can_see_crew:
        review_crew_list = db.query(models.CrewChange).filter(
            models.CrewChange.status == models.TaskStatus.NEEDS_REVIEW
        ).order_by(models.CrewChange.updated_at.desc()).limit(5).all()

        for c in review_crew_list:
            need_review_list.append(schemas.DashboardItem(
                id=c.id,
                type="crew",
                title=f"{c.crew_name} - {c.change_type.value}",
                status=c.status,
                assigned_to=c.creator.full_name if c.creator else None,
                created_at=c.created_at
            ))

    return schemas.DashboardResponse(
        stats=schemas.DashboardStats(
            pending_tasks=pending_tasks,
            rejected_items=rejected_total,
            need_review=need_review_total,
            overdue_checkpoints=overdue_checkpoints,
            pending_payments=pending_payments,
            overdue_payments=overdue_payments,
            total_crew_changes=total_crew_changes,
            active_berths=active_berths
        ),
        pending_items=pending_items,
        rejected_items=rejected_items_list,
        need_review_items=need_review_list
    )
