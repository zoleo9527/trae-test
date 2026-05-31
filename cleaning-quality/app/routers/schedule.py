from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleCheckIn, ScheduleCheckOut, ScheduleOut
from app.services import schedule as svc

router = APIRouter(prefix="/schedules", tags=["排班打卡"])


def _op():
    return "op_default", "默认操作员", "admin"


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
def create_schedule(data: ScheduleCreate, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    try:
        return svc.create_schedule(db, data, op_id, op_name, op_role)
    except ValueError as e:
        raise HTTPException(409, str(e))


@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(schedule_id: int, data: ScheduleUpdate, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    s = svc.update_schedule(db, schedule_id, data, op_id, op_name, op_role)
    if not s:
        raise HTTPException(404, "排班记录不存在")
    return s


@router.post("/{schedule_id}/check-in", response_model=ScheduleOut)
def check_in(schedule_id: int, data: ScheduleCheckIn, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    try:
        s = svc.check_in(db, schedule_id, data, op_id, op_name, op_role)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not s:
        raise HTTPException(404, "排班记录不存在")
    return s


@router.post("/{schedule_id}/check-out", response_model=ScheduleOut)
def check_out(schedule_id: int, data: ScheduleCheckOut, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    try:
        s = svc.check_out(db, schedule_id, data, op_id, op_name, op_role)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not s:
        raise HTTPException(404, "排班记录不存在")
    return s
