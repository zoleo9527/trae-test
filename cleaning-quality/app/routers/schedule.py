from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleCheckIn, ScheduleCheckOut, ScheduleOut
from app.schemas.operator import OperatorContext
from app.dependencies import get_operator_context
from app.services.idempotency import check_idempotency, create_idempotency_record, DuplicateSubmissionError, MissingIdempotencyKeyError
from app.services import schedule as svc

router = APIRouter(prefix="/schedules", tags=["排班打卡"])


@router.get("", response_model=list[ScheduleOut])
def list_schedules(
    project_id: Optional[int] = None,
    work_date: Optional[date] = None,
    staff_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return svc.get_schedules(db, project_id, work_date, staff_id, status)


@router.get("/{schedule_id}", response_model=ScheduleOut)
def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    s = svc.get_schedule(db, schedule_id)
    if not s:
        raise HTTPException(404, "排班记录不存在")
    return s


@router.post("", response_model=ScheduleOut, status_code=201)
def create_schedule(
    data: ScheduleCreate,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    if not x_idempotency_key:
        raise MissingIdempotencyKeyError("schedule")
    try:
        check_idempotency(db, x_idempotency_key, "schedule", operator.operator_id)
        s = svc.create_schedule(db, data, operator.operator_id, operator.operator_name, operator.operator_role)
        create_idempotency_record(db, x_idempotency_key, "schedule", s.id, operator.operator_id)
        db.commit()
        db.refresh(s)
        return s
    except DuplicateSubmissionError as e:
        db.rollback()
        raise HTTPException(409, str(e))
    except MissingIdempotencyKeyError as e:
        db.rollback()
        raise HTTPException(400, str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(400, str(e))


@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(
    schedule_id: int,
    data: ScheduleUpdate,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
):
    s = svc.update_schedule(db, schedule_id, data, operator.operator_id, operator.operator_name, operator.operator_role)
    if not s:
        raise HTTPException(404, "排班记录不存在")
    return s


@router.post("/{schedule_id}/check-in", response_model=ScheduleOut)
def check_in(
    schedule_id: int,
    data: ScheduleCheckIn,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
):
    try:
        s = svc.check_in(db, schedule_id, data, operator.operator_id, operator.operator_name, operator.operator_role)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not s:
        raise HTTPException(404, "排班记录不存在")
    return s


@router.post("/{schedule_id}/check-out", response_model=ScheduleOut)
def check_out(
    schedule_id: int,
    data: ScheduleCheckOut,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
):
    try:
        s = svc.check_out(db, schedule_id, data, operator.operator_id, operator.operator_name, operator.operator_role)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not s:
        raise HTTPException(404, "排班记录不存在")
    return s
