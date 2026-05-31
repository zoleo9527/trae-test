from typing import Optional
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.schedule import Schedule
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleCheckIn, ScheduleCheckOut
from app.services.audit import log_audit


def get_schedules(
    db: Session,
    project_id: Optional[int] = None,
    work_date: Optional[date] = None,
    staff_id: Optional[str] = None,
    status: Optional[str] = None,
) -> list[Schedule]:
    q = db.query(Schedule)
    if project_id is not None:
        q = q.filter(Schedule.project_id == project_id)
    if work_date is not None:
        q = q.filter(Schedule.work_date == work_date)
    if staff_id is not None:
        q = q.filter(Schedule.staff_id == staff_id)
    if status is not None:
        q = q.filter(Schedule.status == status)
    return q.order_by(Schedule.work_date.desc(), Schedule.id.desc()).all()


def get_schedule(db: Session, schedule_id: int) -> Optional[Schedule]:
    return db.query(Schedule).filter(Schedule.id == schedule_id).first()


def create_schedule(db: Session, data: ScheduleCreate, operator_id: str, operator_name: str, operator_role: str) -> Schedule:
    conflict = db.query(Schedule).filter(
        and_(
            Schedule.staff_id == data.staff_id,
            Schedule.work_date == data.work_date,
            Schedule.shift_type == data.shift_type,
            Schedule.status != "cancelled",
        )
    ).first()
    if conflict:
        raise ValueError(
            f"员工 {data.staff_name} 在 {data.work_date} 的 {data.shift_type} 班次已存在(排班ID={conflict.id})"
        )
    schedule = Schedule(**data.model_dump(), status="planned")
    db.add(schedule)
    db.flush()
    log_audit(
        db, "schedule", schedule.id, "create",
        operator_id, operator_name, operator_role,
        new_values=data.model_dump(),
    )
    return schedule


def update_schedule(db: Session, schedule_id: int, data: ScheduleUpdate, operator_id: str, operator_name: str, operator_role: str) -> Optional[Schedule]:
    schedule = get_schedule(db, schedule_id)
    if not schedule:
        return None
    old_values = {k: getattr(schedule, k) for k in data.model_dump(exclude_unset=True)}
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(schedule, k, v)
    log_audit(
        db, "schedule", schedule.id, "update",
        operator_id, operator_name, operator_role,
        old_values=old_values,
        new_values=data.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(schedule)
    return schedule


def check_in(db: Session, schedule_id: int, data: ScheduleCheckIn, operator_id: str, operator_name: str, operator_role: str) -> Optional[Schedule]:
    schedule = get_schedule(db, schedule_id)
    if not schedule:
        return None
    if schedule.status not in ("planned",):
        raise ValueError(f"排班状态为 {schedule.status}，不允许打卡签到")
    old_status = schedule.status
    schedule.check_in_time = data.check_in_time or datetime.utcnow()
    schedule.check_in_photo = data.check_in_photo
    schedule.status = "checked_in"
    log_audit(
        db, "schedule", schedule.id, "check_in",
        operator_id, operator_name, operator_role,
        old_values={"status": old_status},
        new_values={"status": "checked_in", "check_in_time": str(schedule.check_in_time)},
    )
    db.commit()
    db.refresh(schedule)
    return schedule


def check_out(db: Session, schedule_id: int, data: ScheduleCheckOut, operator_id: str, operator_name: str, operator_role: str) -> Optional[Schedule]:
    schedule = get_schedule(db, schedule_id)
    if not schedule:
        return None
    if schedule.status not in ("checked_in",):
        raise ValueError(f"排班状态为 {schedule.status}，不允许打卡签退")
    old_status = schedule.status
    schedule.check_out_time = data.check_out_time or datetime.utcnow()
    schedule.check_out_photo = data.check_out_photo
    schedule.status = "checked_out"
    log_audit(
        db, "schedule", schedule.id, "check_out",
        operator_id, operator_name, operator_role,
        old_values={"status": old_status},
        new_values={"status": "checked_out", "check_out_time": str(schedule.check_out_time)},
    )
    db.commit()
    db.refresh(schedule)
    return schedule


def count_missed_check_ins(db: Session, target_date: Optional[date] = None) -> int:
    d = target_date or date.today()
    return (
        db.query(Schedule)
        .filter(Schedule.work_date == d, Schedule.status == "planned")
        .count()
    )
