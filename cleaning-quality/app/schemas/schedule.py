from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, Field


class ScheduleCreate(BaseModel):
    project_id: int
    staff_id: str = Field(..., max_length=50)
    staff_name: str = Field(..., max_length=100)
    work_date: date
    shift_type: str = Field(..., max_length=30)
    remark: Optional[str] = None


class ScheduleCheckIn(BaseModel):
    check_in_time: Optional[datetime] = None
    check_in_photo: Optional[str] = None


class ScheduleCheckOut(BaseModel):
    check_out_time: Optional[datetime] = None
    check_out_photo: Optional[str] = None


class ScheduleUpdate(BaseModel):
    shift_type: Optional[str] = None
    remark: Optional[str] = None
    status: Optional[str] = None


class ScheduleOut(BaseModel):
    id: int
    project_id: int
    staff_id: str
    staff_name: str
    work_date: date
    shift_type: str
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    check_in_photo: Optional[str] = None
    check_out_photo: Optional[str] = None
    status: str
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
