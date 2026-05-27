from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


class User(BaseModel):
    id: str
    username: str
    name: str
    role: str
    phone: str
    avatar: str

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class Customer(BaseModel):
    id: str
    name: str
    contact: str
    phone: str
    address: str
    water_type: str
    price_per_bucket: float
    deposit_buckets: int
    total_buckets_delivered: int
    total_buckets_returned: int
    outstanding_buckets: int

    class Config:
        from_attributes = True


class Order(BaseModel):
    id: str
    customer_id: str
    customer_name: str
    order_date: str
    water_type: str
    quantity: int
    price_per_bucket: float
    total_amount: float
    status: str
    delivery_route_id: Optional[str]
    delivery_sequence: Optional[int]
    note: Optional[str]
    created_at: str
    signed_photo_url: Optional[str]
    delivered_quantity: int
    returned_empty_buckets: int
    actual_delivered_at: Optional[str]
    recipient_signature: Optional[str]

    class Config:
        from_attributes = True


class DeliverySignRequest(BaseModel):
    delivered_quantity: int
    returned_empty_buckets: int
    recipient_signature: str
    signed_photo_url: Optional[str]
    note: Optional[str]


class Route(BaseModel):
    id: str
    name: str
    driver_id: str
    driver_name: str
    date: str
    status: str
    total_orders: int
    delivered_orders: int
    pending_orders: int
    exception_orders: int
    total_buckets: int
    delivered_buckets: int
    returned_buckets: int
    start_time: Optional[str]
    end_time: Optional[str]
    vehicle_no: str
    estimated_return_time: Optional[str]

    class Config:
        from_attributes = True


class RouteDetail(Route):
    orders: List[Order] = []


class ExceptionReport(BaseModel):
    id: str
    order_id: str
    route_id: str
    type: str
    title: str
    description: str
    reported_by: str
    reported_at: str
    status: str
    handled_by: Optional[str]
    handled_at: Optional[str]
    resolution: Optional[str]
    photos: List[str] = []

    class Config:
        from_attributes = True


class ExceptionCreate(BaseModel):
    order_id: str
    route_id: str
    type: str
    title: str
    description: str
    photos: List[str] = []


class ExceptionHandle(BaseModel):
    resolution: str
    handled_by: str


class BucketTransaction(BaseModel):
    id: str
    customer_id: str
    customer_name: str
    order_id: Optional[str]
    type: str
    buckets_change: int
    balance_before: int
    balance_after: int
    operator: str
    created_at: str
    note: Optional[str]

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    today_routes: int = 0
    in_progress_routes: int = 0
    today_orders: int = 0
    delivered_orders: int = 0
    pending_orders: int = 0
    exception_orders: int = 0
    total_buckets_delivered: int = 0
    total_buckets_returned: int = 0
    pending_exceptions: int = 0
