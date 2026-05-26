from __future__ import annotations

from datetime import date, datetime, time
from enum import Enum
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


def new_id() -> str:
    return uuid4().hex[:12]


# ---------- Enums ----------


class CoachStatus(str, Enum):
    active = "active"
    leave = "leave"
    off = "off"


class CourseStatus(str, Enum):
    scheduled = "scheduled"
    completed = "completed"
    cancelled = "cancelled"
    leave = "leave"
    rescheduled = "rescheduled"


class LeaveStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class LeaveType(str, Enum):
    annual = "annual"
    sick = "sick"
    personal = "personal"
    other = "other"


class WaterItem(str, Enum):
    ph = "pH"
    residual_chlorine = "余氯"
    turbidity = "浊度"
    temperature = "水温"
    urea = "尿素"
    coliform = "大肠菌群"


class InspectionStatus(str, Enum):
    pending = "pending"
    recorded = "recorded"
    abnormal = "abnormal"
    rectifying = "rectifying"
    recheck_pending = "recheck_pending"
    recheck_passed = "recheck_passed"
    closed = "closed"


class RecheckStatus(str, Enum):
    pending = "pending"
    passed = "passed"
    failed = "failed"


# ---------- Models ----------


class Coach(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    title: str = "教练"
    status: CoachStatus = CoachStatus.active
    phone: Optional[str] = None


class Member(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    phone: Optional[str] = None
    balance: float = 0.0
    total_sessions: int = 0
    used_sessions: int = 0


class StoredValueRecord(BaseModel):
    id: str = Field(default_factory=new_id)
    member_id: str
    amount: float
    type: str = "recharge"  # recharge / consume / refund
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)


class Course(BaseModel):
    id: str = Field(default_factory=new_id)
    title: str
    coach_id: str
    date: date
    start_time: time
    end_time: time
    capacity: int = 8
    enrolled: int = 0
    status: CourseStatus = CourseStatus.scheduled
    note: Optional[str] = None


class LeaveRequest(BaseModel):
    id: str = Field(default_factory=new_id)
    coach_id: str
    type: LeaveType = LeaveType.other
    start_date: date
    end_date: date
    reason: str
    substitute_coach_id: Optional[str] = None
    status: LeaveStatus = LeaveStatus.pending
    reviewer: Optional[str] = None
    review_note: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)


class WaterReading(BaseModel):
    item: WaterItem
    value: float
    unit: str
    normal_range: str
    is_abnormal: bool = False


class WaterInspection(BaseModel):
    id: str = Field(default_factory=new_id)
    pool_name: str = "主泳池"
    inspector: str
    inspected_at: datetime = Field(default_factory=datetime.now)
    readings: List[WaterReading] = Field(default_factory=list)
    photo_urls: List[str] = Field(default_factory=list)
    status: InspectionStatus = InspectionStatus.pending
    remark: Optional[str] = None
    rectification_id: Optional[str] = None


class Rectification(BaseModel):
    id: str = Field(default_factory=new_id)
    inspection_id: str
    owner: str
    issue_summary: str
    measures: List[str] = Field(default_factory=list)
    due_date: Optional[date] = None
    status: str = "rectifying"  # rectifying / recheck_pending / closed
    created_at: datetime = Field(default_factory=datetime.now)


class Recheck(BaseModel):
    id: str = Field(default_factory=new_id)
    rectification_id: str
    rechecker: str
    rechecked_at: Optional[datetime] = None
    readings: List[WaterReading] = Field(default_factory=list)
    photo_urls: List[str] = Field(default_factory=list)
    status: RecheckStatus = RecheckStatus.pending
    conclusion: Optional[str] = None


class Complaint(BaseModel):
    id: str = Field(default_factory=new_id)
    member_id: Optional[str] = None
    title: str
    content: str
    status: str = "open"  # open / processing / closed
    handler: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)


# ---------- Request/Response Schemas ----------


class CoachIn(BaseModel):
    name: str
    title: str = "教练"
    phone: Optional[str] = None


class MemberIn(BaseModel):
    name: str
    phone: Optional[str] = None
    balance: float = 0.0
    total_sessions: int = 0


class CourseIn(BaseModel):
    title: str
    coach_id: str
    date: date
    start_time: time
    end_time: time
    capacity: int = 8
    enrolled: int = 0
    note: Optional[str] = None


class CourseUpdate(BaseModel):
    status: Optional[CourseStatus] = None
    note: Optional[str] = None


class LeaveRequestIn(BaseModel):
    coach_id: str
    type: LeaveType = LeaveType.other
    start_date: date
    end_date: date
    reason: str
    substitute_coach_id: Optional[str] = None


class LeaveReviewIn(BaseModel):
    status: LeaveStatus
    reviewer: str
    review_note: Optional[str] = None


class WaterInspectionIn(BaseModel):
    pool_name: str = "主泳池"
    inspector: str
    readings: List[WaterReading] = Field(default_factory=list)
    photo_urls: List[str] = Field(default_factory=list)
    remark: Optional[str] = None


class RectificationIn(BaseModel):
    inspection_id: str
    owner: str
    issue_summary: str
    measures: List[str] = Field(default_factory=list)
    due_date: Optional[date] = None


class RecheckIn(BaseModel):
    rectification_id: str
    rechecker: str
    readings: List[WaterReading] = Field(default_factory=list)
    photo_urls: List[str] = Field(default_factory=list)
    status: RecheckStatus = RecheckStatus.pending
    conclusion: Optional[str] = None


class StoredValueIn(BaseModel):
    member_id: str
    amount: float
    type: str = "recharge"
    note: Optional[str] = None


class DashboardStats(BaseModel):
    pending_leaves: int = 0
    rejected_leaves: int = 0
    recheck_pending: int = 0
    abnormal_inspections: int = 0
    today_courses: int = 0
    open_complaints: int = 0
    pending_rectifications: int = 0


class ActivityItem(BaseModel):
    id: str
    kind: str  # leave / inspection / rectification / recheck / complaint / course
    title: str
    status: str
    time: datetime


class DashboardResponse(BaseModel):
    stats: DashboardStats
    activities: List[ActivityItem] = Field(default_factory=list)
