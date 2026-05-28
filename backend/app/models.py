import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class UserRole(str, enum.Enum):
    AGENT_MANAGER = "agent_manager"
    SITE_COORDINATOR = "site_coordinator"
    DOCUMENT_SPECIALIST = "document_specialist"
    FINANCE = "finance"
    ADMIN = "admin"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"
    NEEDS_REVIEW = "needs_review"
    EXPIRED = "expired"


class CrewChangeType(str, enum.Enum):
    SIGN_ON = "sign_on"
    SIGN_OFF = "sign_off"
    TRANSFER = "transfer"


class DocumentType(str, enum.Enum):
    PASSPORT = "passport"
    SEAMAN_BOOK = "seaman_book"
    VISA = "visa"
    MEDICAL_CERT = "medical_cert"
    VACCINATION = "vaccination"
    OTHER = "other"


class PaymentStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PENDING_REIMBURSEMENT = "pending_reimbursement"
    REIMBURSED = "reimbursed"
    OVERDUE = "overdue"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.SITE_COORDINATOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_berths = relationship("BerthPlan", back_populates="creator", foreign_keys="BerthPlan.created_by")
    created_crew_changes = relationship("CrewChange", back_populates="creator", foreign_keys="CrewChange.created_by")
    created_payments = relationship("AdvancePayment", back_populates="creator", foreign_keys="AdvancePayment.created_by")
    audit_logs = relationship("AuditLog", back_populates="user")
    assigned_tasks = relationship("CheckpointReminder", back_populates="assignee", foreign_keys="CheckpointReminder.assigned_to")


class BerthPlan(Base):
    __tablename__ = "berth_plans"

    id = Column(Integer, primary_key=True, index=True)
    vessel_name = Column(String, index=True)
    vessel_imo = Column(String, index=True)
    voyage_number = Column(String)
    port = Column(String, index=True)
    berth_number = Column(String)
    eta = Column(DateTime, index=True)
    etb = Column(DateTime)
    etd = Column(DateTime)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    remarks = Column(Text)
    extra = Column(JSON, default=dict)
    version = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", back_populates="created_berths", foreign_keys=[created_by])
    crew_changes = relationship("CrewChange", back_populates="berth_plan")
    checkpoints = relationship("CheckpointReminder", back_populates="berth_plan")
    payments = relationship("AdvancePayment", back_populates="berth_plan")
    communications = relationship("Communication", back_populates="berth_plan")


class CrewChange(Base):
    __tablename__ = "crew_changes"

    id = Column(Integer, primary_key=True, index=True)
    berth_plan_id = Column(Integer, ForeignKey("berth_plans.id"))
    change_type = Column(Enum(CrewChangeType))
    crew_name = Column(String, index=True)
    crew_rank = Column(String)
    nationality = Column(String)
    document_type = Column(Enum(DocumentType))
    document_number = Column(String)
    document_expiry = Column(DateTime)
    flight_details = Column(String)
    pickup_location = Column(String)
    hotel_required = Column(Boolean, default=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    remarks = Column(Text)
    extra = Column(JSON, default=dict)
    version = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    berth_plan = relationship("BerthPlan", back_populates="crew_changes")
    creator = relationship("User", back_populates="created_crew_changes", foreign_keys=[created_by])
    checkpoints = relationship("CheckpointReminder", back_populates="crew_change")
    communications = relationship("Communication", back_populates="crew_change")


class CheckpointReminder(Base):
    __tablename__ = "checkpoint_reminders"

    id = Column(Integer, primary_key=True, index=True)
    berth_plan_id = Column(Integer, ForeignKey("berth_plans.id"), nullable=True)
    crew_change_id = Column(Integer, ForeignKey("crew_changes.id"), nullable=True)
    title = Column(String, index=True)
    description = Column(Text)
    checkpoint_type = Column(String, index=True)
    due_date = Column(DateTime, index=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    priority = Column(Integer, default=1)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    review_notes = Column(Text, nullable=True)
    extra = Column(JSON, default=dict)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    berth_plan = relationship("BerthPlan", back_populates="checkpoints")
    crew_change = relationship("CrewChange", back_populates="checkpoints")
    assignee = relationship("User", back_populates="assigned_tasks", foreign_keys=[assigned_to])


class AdvancePayment(Base):
    __tablename__ = "advance_payments"

    id = Column(Integer, primary_key=True, index=True)
    berth_plan_id = Column(Integer, ForeignKey("berth_plans.id"))
    reference_number = Column(String, unique=True, index=True)
    vendor_name = Column(String, index=True)
    description = Column(String)
    amount = Column(Float)
    currency = Column(String, default="USD")
    payment_date = Column(DateTime)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.UNPAID)
    reimbursement_status = Column(Enum(PaymentStatus), default=PaymentStatus.UNPAID)
    reimbursement_date = Column(DateTime, nullable=True)
    invoice_number = Column(String, nullable=True)
    remarks = Column(Text)
    extra = Column(JSON, default=dict)
    version = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    berth_plan = relationship("BerthPlan", back_populates="payments")
    creator = relationship("User", back_populates="created_payments", foreign_keys=[created_by])
    communications = relationship("Communication", back_populates="payment")


class Communication(Base):
    __tablename__ = "communications"

    id = Column(Integer, primary_key=True, index=True)
    berth_plan_id = Column(Integer, ForeignKey("berth_plans.id"), nullable=True)
    crew_change_id = Column(Integer, ForeignKey("crew_changes.id"), nullable=True)
    payment_id = Column(Integer, ForeignKey("advance_payments.id"), nullable=True)
    communication_type = Column(String, index=True)
    subject = Column(String)
    content = Column(Text)
    sender = Column(String)
    recipient = Column(String)
    reference = Column(String, nullable=True)
    attachment_info = Column(JSON, default=list)
    extra = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    berth_plan = relationship("BerthPlan", back_populates="communications")
    crew_change = relationship("CrewChange", back_populates="communications")
    payment = relationship("AdvancePayment", back_populates="communications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, index=True)
    resource_type = Column(String, index=True)
    resource_id = Column(Integer, index=True)
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
