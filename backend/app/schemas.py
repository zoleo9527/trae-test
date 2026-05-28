from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class CustomerBase(BaseModel):
    name: str
    phone: str
    address: Optional[str] = None
    type: Optional[str] = "monthly"
    price_per_bucket: Optional[float] = 20.0
    balance_buckets: Optional[int] = 0
    credit_limit: Optional[float] = 0
    status: Optional[str] = "active"


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    price_per_bucket: Optional[float] = None
    balance_buckets: Optional[int] = None
    credit_limit: Optional[float] = None
    current_debt: Optional[float] = None
    status: Optional[str] = None


class Customer(CustomerBase):
    id: int
    current_debt: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    customer_id: int
    buckets_delivered: int = 0
    buckets_returned: int = 0
    delivery_route: Optional[str] = None
    delivery_person: Optional[str] = None
    delivery_date: Optional[datetime] = None
    remark: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    buckets_delivered: Optional[int] = None
    buckets_returned: Optional[int] = None
    delivery_route: Optional[str] = None
    delivery_person: Optional[str] = None
    sign_photo_url: Optional[str] = None
    sign_by: Optional[str] = None
    sign_time: Optional[datetime] = None
    status: Optional[str] = None
    remark: Optional[str] = None


class Order(OrderBase):
    id: int
    order_no: str
    sign_photo_url: Optional[str] = None
    sign_by: Optional[str] = None
    sign_time: Optional[datetime] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    customer: Optional[Customer] = None

    class Config:
        from_attributes = True


class PaymentBase(BaseModel):
    customer_id: int
    amount: float
    payment_method: str
    payment_date: Optional[datetime] = None
    remark: Optional[str] = None
    operator: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class Payment(PaymentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentReminderBase(BaseModel):
    customer_id: int
    amount_due: float
    due_date: datetime
    remark: Optional[str] = None


class PaymentReminderCreate(PaymentReminderBase):
    pass


class PaymentReminderUpdate(BaseModel):
    status: Optional[str] = None
    reminder_count: Optional[int] = None
    last_reminder_time: Optional[datetime] = None
    remark: Optional[str] = None


class PaymentReminder(PaymentReminderBase):
    id: int
    status: str
    reminder_count: int
    last_reminder_time: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    customer: Optional[Customer] = None

    class Config:
        from_attributes = True


class OrderExceptionBase(BaseModel):
    order_id: int
    type: str
    description: str
    reported_by: Optional[str] = None


class OrderExceptionCreate(OrderExceptionBase):
    pass


class OrderExceptionUpdate(BaseModel):
    status: Optional[str] = None
    handled_by: Optional[str] = None
    handled_at: Optional[datetime] = None
    handle_result: Optional[str] = None


class OrderException(OrderExceptionBase):
    id: int
    status: str
    handled_by: Optional[str] = None
    handled_at: Optional[datetime] = None
    handle_result: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OperationLogBase(BaseModel):
    order_id: Optional[int] = None
    customer_id: Optional[int] = None
    operator: str
    action: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    ip_address: Optional[str] = None


class OperationLogCreate(OperationLogBase):
    pass


class OperationLog(OperationLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    pending_orders: int
    rejected_orders: int
    review_needed: int
    pending_exceptions: int
    pending_reminders: int
    total_customers: int
    today_deliveries: int
    monthly_revenue: float
