from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    SALES = "sales"
    MANAGER = "manager"
    INSTALLER = "installer"


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    display_name: str

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PRODUCING = "producing"
    SHIPPED = "shipped"
    PARTIAL_ARRIVED = "partial_arrived"
    ARRIVED = "arrived"
    INSTALLING = "installing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    AFTER_SALES = "after_sales"


class ItemStatus(str, Enum):
    PENDING = "pending"
    PRODUCING = "producing"
    SHIPPED = "shipped"
    ARRIVED = "arrived"
    INSTALLED = "installed"
    DAMAGED = "damaged"
    MISSING = "missing"
    RETURNED = "returned"


class ArrivalStatus(str, Enum):
    ARRIVED = "arrived"
    PARTIAL = "partial"
    DAMAGED = "damaged"
    PENDING = "pending"


class InstallationStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    PROBLEM = "problem"


class SampleStatus(str, Enum):
    LENT = "lent"
    RETURNED = "returned"
    OVERDUE = "overdue"
    LOST = "lost"


class ReplacementStatus(str, Enum):
    PENDING = "pending"
    ORDERED = "ordered"
    ARRIVED = "arrived"
    INSTALLED = "installed"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"


class OrderItemBase(BaseModel):
    product_name: str
    product_code: str
    quantity: int = 1
    unit_price: float = 0
    remarks: Optional[str] = None


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int
    subtotal: float
    status: str

    class Config:
        from_attributes = True


class OrderItemUpdate(BaseModel):
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    status: Optional[str] = None
    remarks: Optional[str] = None


class OrderConfigBase(BaseModel):
    config_type: str
    config_key: str
    config_value: str
    config_description: Optional[str] = None


class OrderConfigCreate(OrderConfigBase):
    item_id: Optional[int] = None


class OrderConfigResponse(OrderConfigBase):
    id: int
    order_id: int
    item_id: Optional[int] = None
    confirmed: bool
    confirmed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderConfigUpdate(BaseModel):
    config_type: Optional[str] = None
    config_key: Optional[str] = None
    config_value: Optional[str] = None
    config_description: Optional[str] = None
    confirmed: Optional[bool] = None


class ArrivalBase(BaseModel):
    item_id: Optional[int] = None
    arrival_date: datetime
    quantity: int = 1
    tracking_no: Optional[str] = None
    warehouse_location: Optional[str] = None
    remarks: Optional[str] = None
    is_partial: bool = False
    damaged_qty: int = 0
    missing_qty: int = 0


class ArrivalCreate(ArrivalBase):
    pass


class ArrivalResponse(ArrivalBase):
    id: int
    order_id: int
    status: str
    received_by: Optional[int] = None

    class Config:
        from_attributes = True


class ArrivalUpdate(BaseModel):
    arrival_date: Optional[datetime] = None
    quantity: Optional[int] = None
    tracking_no: Optional[str] = None
    warehouse_location: Optional[str] = None
    remarks: Optional[str] = None
    is_partial: Optional[bool] = None
    damaged_qty: Optional[int] = None
    missing_qty: Optional[int] = None
    status: Optional[str] = None


class InstallationBase(BaseModel):
    item_id: Optional[int] = None
    scheduled_date: datetime
    installer: str
    contact_name: str
    contact_phone: str
    remarks: Optional[str] = None


class InstallationCreate(InstallationBase):
    pass


class InstallationResponse(InstallationBase):
    id: int
    order_id: int
    status: str
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    reschedule_count: int
    problem_description: Optional[str] = None

    class Config:
        from_attributes = True


class InstallationUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    installer: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    status: Optional[str] = None
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    problem_description: Optional[str] = None
    remarks: Optional[str] = None


class SampleLendingBase(BaseModel):
    sample_name: str
    sample_code: Optional[str] = None
    lent_to: str
    due_date: datetime
    remarks: Optional[str] = None


class SampleLendingCreate(SampleLendingBase):
    pass


class SampleLendingResponse(SampleLendingBase):
    id: int
    order_id: int
    status: str
    lent_date: datetime
    returned_date: Optional[datetime] = None
    condition: Optional[str] = None

    class Config:
        from_attributes = True


class SampleLendingUpdate(BaseModel):
    sample_name: Optional[str] = None
    sample_code: Optional[str] = None
    lent_to: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    returned_date: Optional[datetime] = None
    condition: Optional[str] = None
    remarks: Optional[str] = None


class ReplacementPartBase(BaseModel):
    item_id: Optional[int] = None
    part_name: str
    part_code: Optional[str] = None
    quantity: int = 1
    reason: str
    remarks: Optional[str] = None


class ReplacementPartCreate(ReplacementPartBase):
    pass


class ReplacementPartResponse(ReplacementPartBase):
    id: int
    order_id: int
    status: str
    requested_date: datetime
    ordered_date: Optional[datetime] = None
    arrived_date: Optional[datetime] = None
    installed_date: Optional[datetime] = None
    confirmed_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReplacementPartUpdate(BaseModel):
    part_name: Optional[str] = None
    part_code: Optional[str] = None
    quantity: Optional[int] = None
    reason: Optional[str] = None
    status: Optional[str] = None
    remarks: Optional[str] = None


class OrderTimelineResponse(BaseModel):
    id: int
    order_id: int
    event_type: str
    event_description: str
    event_time: datetime
    operator_name: Optional[str] = None
    metadata_json: Optional[str] = None

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    customer_name: str
    customer_phone: str
    customer_address: str
    total_amount: float = 0
    deposit_amount: float = 0
    expected_delivery_date: Optional[datetime] = None
    remarks: Optional[str] = None


class OrderCreate(OrderBase):
    sales_consultant_id: Optional[int] = None
    showroom_manager_id: Optional[int] = None
    items: List[OrderItemCreate] = []


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    total_amount: Optional[float] = None
    deposit_amount: Optional[float] = None
    status: Optional[str] = None
    sales_consultant_id: Optional[int] = None
    showroom_manager_id: Optional[int] = None
    expected_delivery_date: Optional[datetime] = None
    remarks: Optional[str] = None


class OrderResponse(OrderBase):
    id: int
    order_no: str
    status: str
    sales_consultant_id: Optional[int] = None
    showroom_manager_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    configs: List[OrderConfigResponse] = []
    arrivals: List[ArrivalResponse] = []
    installations: List[InstallationResponse] = []
    sample_lendings: List[SampleLendingResponse] = []
    replacement_parts: List[ReplacementPartResponse] = []
    timeline: List[OrderTimelineResponse] = []

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    id: int
    order_no: str
    customer_name: str
    customer_phone: str
    total_amount: float
    status: str
    sales_consultant_id: Optional[int] = None
    showroom_manager_id: Optional[int] = None
    created_at: datetime
    expected_delivery_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedOrders(BaseModel):
    total: int
    page: int
    page_size: int
    orders: List[OrderListResponse]


class LoginResponse(BaseModel):
    token: str
    user: UserResponse