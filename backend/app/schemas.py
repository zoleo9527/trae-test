from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from app.models import UserRole, TaskStatus, CrewChangeType, DocumentType, PaymentStatus


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    role: UserRole


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AuditLogBase(BaseModel):
    action: str
    resource_type: str
    resource_id: int
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None


class AuditLogCreate(AuditLogBase):
    user_id: int
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class AuditLog(AuditLogBase):
    id: int
    user_id: int
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BerthPlanBase(BaseModel):
    vessel_name: str
    vessel_imo: Optional[str] = None
    voyage_number: Optional[str] = None
    port: str
    berth_number: Optional[str] = None
    eta: datetime
    etb: Optional[datetime] = None
    etd: Optional[datetime] = None
    remarks: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None


class BerthPlanCreate(BerthPlanBase):
    pass


class BerthPlanUpdate(BaseModel):
    vessel_name: Optional[str] = None
    vessel_imo: Optional[str] = None
    voyage_number: Optional[str] = None
    port: Optional[str] = None
    berth_number: Optional[str] = None
    eta: Optional[datetime] = None
    etb: Optional[datetime] = None
    etd: Optional[datetime] = None
    status: Optional[TaskStatus] = None
    remarks: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None
    version: int


class BerthPlan(BerthPlanBase):
    id: int
    status: TaskStatus
    version: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BerthPlanDetail(BerthPlan):
    creator: Optional[User] = None


class CrewChangeBase(BaseModel):
    berth_plan_id: int
    change_type: CrewChangeType
    crew_name: str
    crew_rank: Optional[str] = None
    nationality: Optional[str] = None
    document_type: Optional[DocumentType] = None
    document_number: Optional[str] = None
    document_expiry: Optional[datetime] = None
    flight_details: Optional[str] = None
    pickup_location: Optional[str] = None
    hotel_required: bool = False
    remarks: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None


class CrewChangeCreate(CrewChangeBase):
    pass


class CrewChangeUpdate(BaseModel):
    berth_plan_id: Optional[int] = None
    change_type: Optional[CrewChangeType] = None
    crew_name: Optional[str] = None
    crew_rank: Optional[str] = None
    nationality: Optional[str] = None
    document_type: Optional[DocumentType] = None
    document_number: Optional[str] = None
    document_expiry: Optional[datetime] = None
    flight_details: Optional[str] = None
    pickup_location: Optional[str] = None
    hotel_required: Optional[bool] = None
    status: Optional[TaskStatus] = None
    remarks: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None
    version: int


class CrewChange(CrewChangeBase):
    id: int
    status: TaskStatus
    version: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CrewChangeDetail(CrewChange):
    creator: Optional[User] = None


class CheckpointReminderBase(BaseModel):
    berth_plan_id: Optional[int] = None
    crew_change_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    checkpoint_type: str
    due_date: datetime
    priority: int = 1
    assigned_to: Optional[int] = None
    extra: Optional[Dict[str, Any]] = None


class CheckpointReminderCreate(CheckpointReminderBase):
    pass


class CheckpointReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    checkpoint_type: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[TaskStatus] = None
    priority: Optional[int] = None
    assigned_to: Optional[int] = None
    rejection_reason: Optional[str] = None
    review_notes: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None
    version: int


class CheckpointReminder(CheckpointReminderBase):
    id: int
    status: TaskStatus
    completed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    review_notes: Optional[str] = None
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CheckpointReminderDetail(CheckpointReminder):
    assignee: Optional[User] = None


class AdvancePaymentBase(BaseModel):
    berth_plan_id: int
    reference_number: str
    vendor_name: str
    description: Optional[str] = None
    amount: float
    currency: str = "USD"
    payment_date: Optional[datetime] = None
    invoice_number: Optional[str] = None
    remarks: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None


class AdvancePaymentCreate(AdvancePaymentBase):
    pass


class AdvancePaymentUpdate(BaseModel):
    berth_plan_id: Optional[int] = None
    vendor_name: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    payment_date: Optional[datetime] = None
    payment_status: Optional[PaymentStatus] = None
    reimbursement_status: Optional[PaymentStatus] = None
    reimbursement_date: Optional[datetime] = None
    invoice_number: Optional[str] = None
    remarks: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None
    version: int


class AdvancePayment(AdvancePaymentBase):
    id: int
    payment_status: PaymentStatus
    reimbursement_status: PaymentStatus
    reimbursement_date: Optional[datetime] = None
    version: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommunicationBase(BaseModel):
    berth_plan_id: Optional[int] = None
    crew_change_id: Optional[int] = None
    payment_id: Optional[int] = None
    communication_type: str
    subject: str
    content: str
    sender: str
    recipient: str
    reference: Optional[str] = None
    attachment_info: Optional[List[Dict[str, Any]]] = None
    extra: Optional[Dict[str, Any]] = None


class CommunicationCreate(CommunicationBase):
    pass


class Communication(CommunicationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    pending_tasks: int
    rejected_items: int
    need_review: int
    overdue_checkpoints: int
    pending_payments: Optional[int] = None
    overdue_payments: Optional[int] = None
    total_crew_changes: Optional[int] = None
    active_berths: int


class DashboardItem(BaseModel):
    id: int
    type: str
    title: str
    status: TaskStatus
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    priority: Optional[int] = None
    created_at: datetime


class DashboardResponse(BaseModel):
    stats: DashboardStats
    pending_items: List[DashboardItem]
    rejected_items: List[DashboardItem]
    need_review_items: List[DashboardItem]
