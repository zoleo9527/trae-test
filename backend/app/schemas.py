from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    VOLUNTEER = "volunteer"


class ScheduleStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class FeedbackStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    RESOLVED = "resolved"
    REJECTED = "rejected"
    NEEDS_REVIEW = "needs_review"


class FeedbackType(str, Enum):
    COMPLAINT = "complaint"
    SUGGESTION = "suggestion"
    PRAISE = "praise"
    QUESTION = "question"


class ExhibitStatus(str, Enum):
    IN_STORAGE = "in_storage"
    ON_DISPLAY = "on_display"
    ON_LOAN = "on_loan"
    IN_TRANSIT = "in_transit"
    MAINTENANCE = "maintenance"


class ActivityStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class UserBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    role: UserRole = UserRole.VOLUNTEER


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VolunteerScheduleBase(BaseModel):
    volunteer_id: int
    date: datetime
    shift_start: datetime
    shift_end: datetime
    location: Optional[str] = None
    task_description: Optional[str] = None


class VolunteerScheduleCreate(VolunteerScheduleBase):
    pass


class VolunteerScheduleUpdate(BaseModel):
    status: Optional[ScheduleStatus] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    notes: Optional[str] = None


class VolunteerSchedule(VolunteerScheduleBase):
    id: int
    status: ScheduleStatus
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    notes: Optional[str] = None
    volunteer: Optional[User] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FeedbackBase(BaseModel):
    visitor_name: Optional[str] = None
    visitor_contact: Optional[str] = None
    feedback_type: FeedbackType
    title: str
    content: str


class FeedbackCreate(FeedbackBase):
    schedule_id: Optional[int] = None


class FeedbackUpdate(BaseModel):
    status: Optional[FeedbackStatus] = None
    handler_id: Optional[int] = None
    response: Optional[str] = None
    needs_review: Optional[bool] = None
    review_notes: Optional[str] = None


class ReviewTraceBase(BaseModel):
    operator_name: str
    action: str
    remarks: Optional[str] = None


class ReviewTraceCreate(ReviewTraceBase):
    feedback_id: int


class ReviewTrace(ReviewTraceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Feedback(FeedbackBase):
    id: int
    schedule_id: Optional[int] = None
    status: FeedbackStatus
    handler_id: Optional[int] = None
    response: Optional[str] = None
    response_at: Optional[datetime] = None
    needs_review: bool
    review_notes: Optional[str] = None
    schedule: Optional[VolunteerSchedule] = None
    review_traces: List[ReviewTrace] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExhibitBase(BaseModel):
    name: str
    code: str
    artist: Optional[str] = None
    year: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    status: ExhibitStatus = ExhibitStatus.IN_STORAGE
    image_url: Optional[str] = None


class ExhibitCreate(ExhibitBase):
    pass


class ExhibitUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    status: Optional[ExhibitStatus] = None


class ExhibitTransferBase(BaseModel):
    from_location: str
    to_location: str
    transfer_type: Optional[str] = None
    handler_name: Optional[str] = None
    notes: Optional[str] = None


class ExhibitTransferCreate(ExhibitTransferBase):
    exhibit_id: int


class ExhibitTransfer(ExhibitTransferBase):
    id: int
    exhibit_id: int
    confirmed: bool
    confirmed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Exhibit(ExhibitBase):
    id: int
    transfers: List[ExhibitTransfer] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ActivityBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    max_participants: Optional[int] = None


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    status: Optional[ActivityStatus] = None


class TicketBase(BaseModel):
    activity_id: int
    ticket_code: str
    visitor_name: Optional[str] = None
    visitor_phone: Optional[str] = None


class TicketCreate(TicketBase):
    pass


class Ticket(TicketBase):
    id: int
    verification_status: VerificationStatus
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Activity(ActivityBase):
    id: int
    status: ActivityStatus
    tickets: List[Ticket] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    pending_feedbacks: int
    rejected_feedbacks: int
    pending_schedules: int
    pending_transfers: int
    pending_tickets: int
    needs_review_count: int
