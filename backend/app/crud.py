from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional, Type, Any, Dict

from app import models, schemas
from app.auth import get_password_hash
from app.audit import check_version


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_berth_plans(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[models.TaskStatus] = None,
    port: Optional[str] = None
):
    query = db.query(models.BerthPlan)
    if status:
        query = query.filter(models.BerthPlan.status == status)
    if port:
        query = query.filter(models.BerthPlan.port.ilike(f"%{port}%"))
    return query.order_by(models.BerthPlan.created_at.desc()).offset(skip).limit(limit).all()


def get_berth_plan(db: Session, berth_id: int):
    return db.query(models.BerthPlan).filter(models.BerthPlan.id == berth_id).first()


def create_berth_plan(db: Session, berth: schemas.BerthPlanCreate, user_id: int):
    db_berth = models.BerthPlan(
        **berth.model_dump(exclude_unset=True),
        created_by=user_id
    )
    db.add(db_berth)
    db.commit()
    db.refresh(db_berth)
    return db_berth


def update_berth_plan(db: Session, berth_id: int, berth: schemas.BerthPlanUpdate):
    db_berth = get_berth_plan(db, berth_id)
    if not db_berth:
        return None
    check_version(db_berth.version, berth.version, "berth_plan", berth_id)
    update_data = berth.model_dump(exclude_unset=True, exclude={"version"})
    for field, value in update_data.items():
        setattr(db_berth, field, value)
    db_berth.version += 1
    db.commit()
    db.refresh(db_berth)
    return db_berth


def get_crew_changes(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[models.TaskStatus] = None,
    berth_plan_id: Optional[int] = None
):
    query = db.query(models.CrewChange)
    if status:
        query = query.filter(models.CrewChange.status == status)
    if berth_plan_id:
        query = query.filter(models.CrewChange.berth_plan_id == berth_plan_id)
    return query.order_by(models.CrewChange.created_at.desc()).offset(skip).limit(limit).all()


def get_crew_change(db: Session, crew_id: int):
    return db.query(models.CrewChange).filter(models.CrewChange.id == crew_id).first()


def create_crew_change(db: Session, crew: schemas.CrewChangeCreate, user_id: int):
    db_crew = models.CrewChange(
        **crew.model_dump(exclude_unset=True),
        created_by=user_id
    )
    db.add(db_crew)
    db.commit()
    db.refresh(db_crew)
    return db_crew


def update_crew_change(db: Session, crew_id: int, crew: schemas.CrewChangeUpdate):
    db_crew = get_crew_change(db, crew_id)
    if not db_crew:
        return None
    check_version(db_crew.version, crew.version, "crew_change", crew_id)
    update_data = crew.model_dump(exclude_unset=True, exclude={"version"})
    for field, value in update_data.items():
        setattr(db_crew, field, value)
    db_crew.version += 1
    db.commit()
    db.refresh(db_crew)
    return db_crew


def get_checkpoints(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[models.TaskStatus] = None,
    assigned_to: Optional[int] = None,
    overdue_only: bool = False
):
    query = db.query(models.CheckpointReminder)
    if status:
        query = query.filter(models.CheckpointReminder.status == status)
    if assigned_to:
        query = query.filter(models.CheckpointReminder.assigned_to == assigned_to)
    if overdue_only:
        query = query.filter(
            and_(
                models.CheckpointReminder.due_date < datetime.now(),
                models.CheckpointReminder.status != models.TaskStatus.COMPLETED
            )
        )
    return query.order_by(models.CheckpointReminder.due_date.asc()).offset(skip).limit(limit).all()


def get_checkpoint(db: Session, checkpoint_id: int):
    return db.query(models.CheckpointReminder).filter(models.CheckpointReminder.id == checkpoint_id).first()


def create_checkpoint(db: Session, checkpoint: schemas.CheckpointReminderCreate):
    db_checkpoint = models.CheckpointReminder(**checkpoint.model_dump(exclude_unset=True))
    db.add(db_checkpoint)
    db.commit()
    db.refresh(db_checkpoint)
    return db_checkpoint


def update_checkpoint(db: Session, checkpoint_id: int, checkpoint: schemas.CheckpointReminderUpdate):
    db_checkpoint = get_checkpoint(db, checkpoint_id)
    if not db_checkpoint:
        return None
    check_version(db_checkpoint.version, checkpoint.version, "checkpoint", checkpoint_id)
    update_data = checkpoint.model_dump(exclude_unset=True, exclude={"version"})
    for field, value in update_data.items():
        setattr(db_checkpoint, field, value)
    if checkpoint.status == models.TaskStatus.COMPLETED and not db_checkpoint.completed_at:
        db_checkpoint.completed_at = datetime.now()
    db_checkpoint.version += 1
    db.commit()
    db.refresh(db_checkpoint)
    return db_checkpoint


def get_payments(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    payment_status: Optional[models.PaymentStatus] = None,
    reimbursement_status: Optional[models.PaymentStatus] = None,
    vendor_name: Optional[str] = None
):
    query = db.query(models.AdvancePayment)
    if payment_status:
        query = query.filter(models.AdvancePayment.payment_status == payment_status)
    if reimbursement_status:
        query = query.filter(models.AdvancePayment.reimbursement_status == reimbursement_status)
    if vendor_name:
        query = query.filter(models.AdvancePayment.vendor_name.ilike(f"%{vendor_name}%"))
    return query.order_by(models.AdvancePayment.created_at.desc()).offset(skip).limit(limit).all()


def get_payment(db: Session, payment_id: int):
    return db.query(models.AdvancePayment).filter(models.AdvancePayment.id == payment_id).first()


def create_payment(db: Session, payment: schemas.AdvancePaymentCreate, user_id: int):
    db_payment = models.AdvancePayment(
        **payment.model_dump(exclude_unset=True),
        created_by=user_id
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment


def update_payment(db: Session, payment_id: int, payment: schemas.AdvancePaymentUpdate):
    db_payment = get_payment(db, payment_id)
    if not db_payment:
        return None
    check_version(db_payment.version, payment.version, "payment", payment_id)
    update_data = payment.model_dump(exclude_unset=True, exclude={"version"})
    for field, value in update_data.items():
        setattr(db_payment, field, value)
    db_payment.version += 1
    db.commit()
    db.refresh(db_payment)
    return db_payment


def get_communications(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    berth_plan_id: Optional[int] = None,
    crew_change_id: Optional[int] = None,
    payment_id: Optional[int] = None
):
    query = db.query(models.Communication)
    if berth_plan_id:
        query = query.filter(models.Communication.berth_plan_id == berth_plan_id)
    if crew_change_id:
        query = query.filter(models.Communication.crew_change_id == crew_change_id)
    if payment_id:
        query = query.filter(models.Communication.payment_id == payment_id)
    return query.order_by(models.Communication.created_at.desc()).offset(skip).limit(limit).all()


def create_communication(db: Session, comm: schemas.CommunicationCreate):
    db_comm = models.Communication(**comm.model_dump(exclude_unset=True))
    db.add(db_comm)
    db.commit()
    db.refresh(db_comm)
    return db_comm


def get_audit_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    user_id: Optional[int] = None
):
    query = db.query(models.AuditLog)
    if resource_type:
        query = query.filter(models.AuditLog.resource_type == resource_type)
    if resource_id:
        query = query.filter(models.AuditLog.resource_id == resource_id)
    if user_id:
        query = query.filter(models.AuditLog.user_id == user_id)
    return query.order_by(models.AuditLog.created_at.desc()).offset(skip).limit(limit).all()
