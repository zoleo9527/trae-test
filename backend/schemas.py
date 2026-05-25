from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    name: str
    role: str
    department: Optional[str] = None


class UserCreate(UserBase):
    password: str


class User(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class BookBase(BaseModel):
    isbn: str
    title: str
    author: str
    publisher: str
    publish_date: date
    price: float
    category: Optional[str] = None


class BookCreate(BookBase):
    pass


class Book(BookBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ChannelBase(BaseModel):
    name: str
    type: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[float] = None


class ChannelCreate(ChannelBase):
    pass


class Channel(ChannelBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class DistributionBase(BaseModel):
    book_id: int
    channel_id: int
    quantity: int
    sample_quantity: Optional[int] = 0
    distribution_date: date
    tracking_no: Optional[str] = None
    courier_company: Optional[str] = None
    remarks: Optional[str] = None


class DistributionCreate(DistributionBase):
    handler_id: int
    channel_manager_id: int


class DistributionUpdate(BaseModel):
    status: Optional[str] = None
    receipt_status: Optional[str] = None
    receipt_date: Optional[date] = None
    tracking_no: Optional[str] = None
    courier_company: Optional[str] = None
    remarks: Optional[str] = None


class Distribution(DistributionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    distribution_no: str
    status: str
    receipt_status: str
    receipt_date: Optional[date] = None
    handler_id: int
    channel_manager_id: int
    book: Book
    channel: Channel
    handler: User
    channel_manager: User
    created_at: datetime
    updated_at: datetime


class ReturnBase(BaseModel):
    distribution_id: int
    quantity: int
    return_date: date
    return_reason: str
    return_type: str
    remarks: Optional[str] = None


class ReturnCreate(ReturnBase):
    handler_id: int


class ReturnUpdate(BaseModel):
    status: Optional[str] = None
    receive_status: Optional[str] = None
    receive_date: Optional[date] = None
    remarks: Optional[str] = None
    quantity_discrepancy: Optional[bool] = False
    discrepancy_note: Optional[str] = None


class Return(ReturnBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    return_no: str
    status: str
    receive_status: str
    receive_date: Optional[date] = None
    handler_id: int
    quantity_discrepancy: bool
    discrepancy_note: Optional[str] = None
    distribution: Distribution
    handler: User
    created_at: datetime
    updated_at: datetime


class PaymentBase(BaseModel):
    distribution_id: int
    channel_id: int
    amount: float
    payment_date: date
    payment_method: str
    remarks: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    status: Optional[str] = None
    finance_confirm_id: Optional[int] = None
    finance_confirm_date: Optional[date] = None
    remarks: Optional[str] = None


class Payment(PaymentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    payment_no: str
    status: str
    finance_confirm_id: Optional[int] = None
    finance_confirm_date: Optional[date] = None
    distribution: Distribution
    channel: Channel
    created_at: datetime
    updated_at: datetime


class ExceptionRecordBase(BaseModel):
    related_type: str
    related_id: int
    exception_type: str
    description: str


class ExceptionRecordCreate(ExceptionRecordBase):
    handler_id: int


class ExceptionRecordUpdate(BaseModel):
    status: Optional[str] = None
    resolution: Optional[str] = None


class ExceptionRecord(ExceptionRecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    handler_id: int
    resolved_at: Optional[datetime] = None
    resolution: Optional[str] = None
    handler: User
    created_at: datetime


class ChannelFeedbackBase(BaseModel):
    distribution_id: int
    feedback_type: str
    feedback_date: date
    sales_quantity: Optional[int] = 0
    feedback_content: Optional[str] = None
    feedback_by: Optional[str] = None


class ChannelFeedbackCreate(ChannelFeedbackBase):
    pass


class ChannelFeedback(ChannelFeedbackBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class DashboardStats(BaseModel):
    total_distributions: int
    pending_receipt: int
    pending_return: int
    pending_payment: int
    exception_count: int
    total_sales_amount: float
    total_return_amount: float
    total_payment_amount: float


class DistributionDetail(Distribution):
    returns: List[Return] = []
    payments: List[Payment] = []
    feedbacks: List[ChannelFeedback] = []
    exceptions: List[ExceptionRecord] = []
