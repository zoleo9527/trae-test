from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    display_name: str
    role: str


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    role: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class PlotCreate(BaseModel):
    plot_code: str
    location: Optional[str] = None
    seedling_type: str
    total_count: int
    available_count: int
    status: Optional[str] = "在圃"
    remark: Optional[str] = None


class PlotUpdate(BaseModel):
    plot_code: Optional[str] = None
    location: Optional[str] = None
    seedling_type: Optional[str] = None
    total_count: Optional[int] = None
    available_count: Optional[int] = None
    status: Optional[str] = None
    remark: Optional[str] = None


class PlotResponse(BaseModel):
    id: int
    plot_code: str
    location: Optional[str]
    seedling_type: str
    total_count: int
    available_count: int
    status: str
    remark: Optional[str]

    class Config:
        from_attributes = True


class LiftingOrderCreate(BaseModel):
    plot_id: int
    seedling_type: str
    requested_count: int
    requester_id: int
    assignee_id: int
    planned_date: Optional[datetime] = None
    remark: Optional[str] = None


class LiftingOrderUpdate(BaseModel):
    seedling_type: Optional[str] = None
    requested_count: Optional[int] = None
    assignee_id: Optional[int] = None
    status: Optional[str] = None
    planned_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    remark: Optional[str] = None


class LiftingOrderResponse(BaseModel):
    id: int
    order_no: str
    plot_id: int
    seedling_type: str
    requested_count: int
    requester_id: int
    assignee_id: int
    status: str
    planned_date: Optional[datetime]
    completed_at: Optional[datetime]
    remark: Optional[str]
    plot: Optional[PlotResponse] = None
    requester: Optional[UserResponse] = None
    assignee: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class LoadingCheckCreate(BaseModel):
    order_id: int
    checker_id: int
    planned_qty: int
    actual_qty: Optional[int] = None
    vehicle_no: Optional[str] = None
    driver_name: Optional[str] = None
    remark: Optional[str] = None


class LoadingCheckUpdate(BaseModel):
    actual_qty: Optional[int] = None
    vehicle_no: Optional[str] = None
    driver_name: Optional[str] = None
    status: Optional[str] = None
    loaded_at: Optional[datetime] = None
    remark: Optional[str] = None


class LoadingCheckResponse(BaseModel):
    id: int
    order_id: int
    checker_id: int
    planned_qty: int
    actual_qty: Optional[int]
    vehicle_no: Optional[str]
    driver_name: Optional[str]
    status: str
    loaded_at: Optional[datetime]
    remark: Optional[str]
    order: Optional[LiftingOrderResponse] = None
    checker: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class ExceptionRecordCreate(BaseModel):
    source_type: str
    source_id: int
    exception_type: str
    severity: str
    description: str
    handler_id: Optional[int] = None


class ExceptionReport(BaseModel):
    exception_type: str
    severity: str
    description: str


class LoadingFillUpdate(BaseModel):
    actual_qty: int
    vehicle_no: Optional[str] = None
    driver_name: Optional[str] = None


class ExceptionRecordUpdate(BaseModel):
    exception_type: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    handler_id: Optional[int] = None
    status: Optional[str] = None
    resolution: Optional[str] = None


class ExceptionRecordResponse(BaseModel):
    id: int
    source_type: str
    source_id: int
    exception_type: str
    severity: str
    description: str
    handler_id: Optional[int]
    status: str
    resolution: Optional[str]
    created_at: datetime
    handled_at: Optional[datetime]
    closed_at: Optional[datetime]
    handler: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class AuditLogCreate(BaseModel):
    user_id: int
    action: str
    target_type: str
    target_id: int
    detail: Optional[str] = None


class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    target_type: str
    target_id: int
    detail: Optional[str]
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_plots: int
    total_orders: int
    total_loading: int
    total_exceptions: int
    orders_by_status: dict
    exceptions_by_severity: dict
    loading_by_status: dict


class LoginRequest(BaseModel):
    username: str


class LoginResponse(BaseModel):
    user: UserResponse
