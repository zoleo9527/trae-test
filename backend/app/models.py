from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from .database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    VOLUNTEER = "volunteer"


class ScheduleStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class FeedbackStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    RESOLVED = "resolved"
    REJECTED = "resolved"
    NEEDS_REVIEW = "needs_review"


class FeedbackType(str, enum.Enum):
    COMPLAINT = "complaint"
    SUGGESTION = "suggestion"
    PRAISE = "praise"
    QUESTION = "question"


class ExhibitStatus(str, enum.Enum):
    IN_STORAGE = "in_storage"
    ON_DISPLAY = "on_display"
    ON_LOAN = "on_loan"
    IN_TRANSIT = "in_transit"
    MAINTENANCE = "maintenance"


class ActivityStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True)
    phone = Column(String(20))
    role = Column(Enum(UserRole), default=UserRole.VOLUNTEER)
    avatar = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    schedules = relationship("VolunteerSchedule", back_populates="volunteer")
    feedback_responses = relationship("Feedback", foreign_keys="Feedback.handler_id", back_populates="handler")


class VolunteerSchedule(Base):
    __tablename__ = "volunteer_schedules"

    id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime(timezone=True), nullable=False)
    shift_start = Column(DateTime(timezone=True), nullable=False)
    shift_end = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(100))
    task_description = Column(Text)
    status = Column(Enum(ScheduleStatus), default=ScheduleStatus.PENDING)
    check_in_time = Column(DateTime(timezone=True))
    check_out_time = Column(DateTime(timezone=True))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    volunteer = relationship("User", back_populates="schedules")
    feedbacks = relationship("Feedback", back_populates="schedule")


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("volunteer_schedules.id"))
    visitor_name = Column(String(100))
    visitor_contact = Column(String(100))
    feedback_type = Column(Enum(FeedbackType), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(Enum(FeedbackStatus), default=FeedbackStatus.PENDING)
    handler_id = Column(Integer, ForeignKey("users.id"))
    response = Column(Text)
    response_at = Column(DateTime(timezone=True))
    needs_review = Column(Boolean, default=False)
    review_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    schedule = relationship("VolunteerSchedule", back_populates="feedbacks")
    handler = relationship("User", back_populates="feedback_responses")
    review_traces = relationship("ReviewTrace", back_populates="feedback")


class Exhibit(Base):
    __tablename__ = "exhibits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, index=True)
    artist = Column(String(100))
    year = Column(String(20))
    description = Column(Text)
    location = Column(String(100))
    status = Column(Enum(ExhibitStatus), default=ExhibitStatus.IN_STORAGE)
    image_url = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    transfers = relationship("ExhibitTransfer", back_populates="exhibit", order_by="desc(ExhibitTransfer.created_at)")


class ExhibitTransfer(Base):
    __tablename__ = "exhibit_transfers"

    id = Column(Integer, primary_key=True, index=True)
    exhibit_id = Column(Integer, ForeignKey("exhibits.id"))
    from_location = Column(String(100), nullable=False)
    to_location = Column(String(100), nullable=False)
    transfer_type = Column(String(50))
    handler_name = Column(String(100))
    confirmed = Column(Boolean, default=False)
    confirmed_at = Column(DateTime(timezone=True))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    exhibit = relationship("Exhibit", back_populates="transfers")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(100))
    max_participants = Column(Integer)
    status = Column(Enum(ActivityStatus), default=ActivityStatus.DRAFT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tickets = relationship("Ticket", back_populates="activity")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    ticket_code = Column(String(50), unique=True, index=True)
    visitor_name = Column(String(100))
    visitor_phone = Column(String(20))
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING)
    verified_at = Column(DateTime(timezone=True))
    verified_by = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    activity = relationship("Activity", back_populates="tickets")


class ReviewTrace(Base):
    __tablename__ = "review_traces"

    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("feedbacks.id"))
    operator_name = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    feedback = relationship("Feedback", back_populates="review_traces")
