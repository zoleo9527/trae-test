from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class TimelineEventBase(BaseModel):
    event_type: str
    title: str
    detail: str = ""
    operator: str = ""
    created_at: Optional[datetime] = None


class TimelineEventOut(TimelineEventBase):
    id: int
    order_id: int

    class Config:
        from_attributes = True


class ReviewBase(BaseModel):
    verdict: str
    feedback: str = ""
    reviewer: str = "客户"


class ReviewOut(ReviewBase):
    id: int
    photo_id: int
    version_at_review: int
    created_at: datetime

    class Config:
        from_attributes = True


class PhotoBase(BaseModel):
    photo_name: str
    category: str = "主纱"
    image_url: str = ""
    version: int = 1


class PhotoOut(PhotoBase):
    id: int
    batch_id: int
    review_status: str
    latest_feedback: str = ""
    source_photo_id: Optional[int] = None
    reviews: List[ReviewOut] = []

    class Config:
        from_attributes = True


class BatchBase(BaseModel):
    batch_no: int = 1
    status: str = "待复核"
    remark: str = ""
    delivered_at: Optional[datetime] = None


class BatchOut(BatchBase):
    id: int
    order_id: int
    photos: List[PhotoOut] = []

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    order_no: str
    customer_name: str
    partner_name: str = ""
    phone: str = ""
    studio_branch: str = "总店"
    package: str = ""
    shoot_date: Optional[datetime] = None
    select_date: Optional[datetime] = None
    store_manager: str = ""
    selector: str = ""
    retoucher: str = ""
    customer_service: str = ""
    remark: str = ""
    balance_status: str = "未结清"
    status: str = "已拍摄"


class OrderOut(OrderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    batches: List[BatchOut] = []
    timeline: List[TimelineEventOut] = []

    class Config:
        from_attributes = True


class OrderListItem(BaseModel):
    id: int
    order_no: str
    customer_name: str
    partner_name: str
    studio_branch: str
    shoot_date: Optional[datetime] = None
    status: str
    balance_status: str
    store_manager: str
    selector: str
    retoucher: str
    customer_service: str
    latest_batch_status: str = ""
    review_pending: int = 0
    review_rejected: int = 0
    review_recheck: int = 0
    updated_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    order_total: int
    review_pending: int
    review_rejected: int
    review_recheck: int
    balance_unpaid: int
    updated_at: datetime


class ReviewSubmit(BaseModel):
    verdict: str  # 通过 / 驳回 / 回查
    feedback: str = ""
    reviewer: str = "客户"


class BatchCreate(BaseModel):
    batch_no: int
    remark: str = ""
    photos: List[PhotoBase] = []


class ResubmitPhoto(BaseModel):
    image_url: str = ""
    remark: str = ""
