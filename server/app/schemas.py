from datetime import datetime, date
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class RepairsStatus(str, Enum):
    PENDING = "待处理"
    IN_PROGRESS = "处理中"
    WAITING_LENS = "待镜片"
    LENS_TRANSFERRING = "镜片调拨中"
    LENS_LOST = "镜片丢失"
    REWORK = "返修中"
    COMPLETED = "已完成"
    REJECTED = "已驳回"
    REFUNDING = "退款中"
    REFUNDED = "已退款"
    NEED_REVIEW = "需回查"


class LensStatus(str, Enum):
    IN_STOCK = "库存充足"
    LOW_STOCK = "库存不足"
    TRANSFERRING = "调拨中"
    LOST = "已丢失"
    REPLACED = "已补货"


class VisitStatus(str, Enum):
    PENDING = "待回访"
    COMPLETED = "已回访"
    FAILED = "回访失败"
    RESCHEDULED = "已改期"


class OptometryOrderBase(BaseModel):
    order_no: str
    customer_name: str
    customer_phone: Optional[str] = None
    store_name: str
    optometrist: str
    exam_date: date
    left_sph: Optional[float] = None
    left_cyl: Optional[float] = None
    left_axis: Optional[int] = None
    right_sph: Optional[float] = None
    right_cyl: Optional[float] = None
    right_axis: Optional[int] = None
    pd: Optional[float] = None
    lens_type: Optional[str] = None
    lens_brand: Optional[str] = None
    frame_model: Optional[str] = None


class OptometryOrderCreate(OptometryOrderBase):
    pass


class OptometryOrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    left_sph: Optional[float] = None
    left_cyl: Optional[float] = None
    left_axis: Optional[int] = None
    right_sph: Optional[float] = None
    right_cyl: Optional[float] = None
    right_axis: Optional[int] = None
    pd: Optional[float] = None
    lens_type: Optional[str] = None
    lens_brand: Optional[str] = None
    frame_model: Optional[str] = None


class OptometryOrder(OptometryOrderBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StatusHistoryBase(BaseModel):
    repair_order_id: int
    from_status: Optional[str] = None
    to_status: str
    changed_by: str
    change_reason: Optional[str] = None


class StatusHistoryCreate(StatusHistoryBase):
    pass


class StatusHistory(StatusHistoryBase):
    id: int
    changed_at: datetime

    class Config:
        from_attributes = True


class LensTransferBase(BaseModel):
    repair_order_id: int
    transfer_no: str
    from_store: str
    to_store: str
    lens_spec: str
    quantity: int = 1
    status: str = "待发货"
    is_lost: int = 0
    lost_reason: Optional[str] = None
    remark: Optional[str] = None


class LensTransferCreate(LensTransferBase):
    pass


class LensTransferUpdate(BaseModel):
    status: Optional[str] = None
    sent_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    is_lost: Optional[int] = None
    lost_reason: Optional[str] = None
    remark: Optional[str] = None


class LensTransfer(LensTransferBase):
    id: int
    sent_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RefundRecordBase(BaseModel):
    repair_order_id: int
    refund_no: str
    amount: float
    reason: str
    applicant: str
    status: str = "待审批"


class RefundRecordCreate(RefundRecordBase):
    pass


class RefundRecordUpdate(BaseModel):
    status: Optional[str] = None
    approver: Optional[str] = None
    reject_reason: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None


class RefundRecord(RefundRecordBase):
    id: int
    approver: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    reject_reason: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VisitRecordBase(BaseModel):
    repair_order_id: int
    visit_no: str
    visit_type: str
    planned_date: date
    visitor: Optional[str] = None
    content: Optional[str] = None
    result: Optional[str] = None
    customer_feedback: Optional[str] = None
    status: str = VisitStatus.PENDING.value
    next_visit_date: Optional[date] = None
    remark: Optional[str] = None


class VisitRecordCreate(VisitRecordBase):
    pass


class VisitRecordUpdate(BaseModel):
    actual_date: Optional[date] = None
    visitor: Optional[str] = None
    content: Optional[str] = None
    result: Optional[str] = None
    customer_feedback: Optional[str] = None
    status: Optional[str] = None
    next_visit_date: Optional[date] = None
    remark: Optional[str] = None


class VisitRecord(VisitRecordBase):
    id: int
    actual_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RepairOrderBase(BaseModel):
    repair_no: str
    optometry_order_id: Optional[int] = None
    optometry_order_no: Optional[str] = None
    customer_name: str
    customer_phone: Optional[str] = None
    store_name: str
    repair_type: str
    repair_reason: str
    processor: Optional[str] = None
    handler: Optional[str] = None
    status: str = RepairsStatus.PENDING.value
    priority: str = "普通"
    lens_status: str = LensStatus.IN_STOCK.value
    lens_transfer_no: Optional[str] = None


class RepairOrderCreate(RepairOrderBase):
    pass


class RepairOrderUpdate(BaseModel):
    processor: Optional[str] = None
    handler: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    lens_status: Optional[str] = None
    lens_transfer_no: Optional[str] = None
    reject_reason: Optional[str] = None
    refund_amount: Optional[float] = None
    refund_reason: Optional[str] = None
    completed_at: Optional[datetime] = None


class RepairOrder(RepairOrderBase):
    id: int
    reject_reason: Optional[str] = None
    refund_amount: Optional[float] = None
    refund_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    status_history: List[StatusHistory] = []
    lens_transfers: List[LensTransfer] = []
    refunds: List[RefundRecord] = []
    visits: List[VisitRecord] = []

    class Config:
        from_attributes = True


class BatchRepairUpdate(BaseModel):
    ids: List[int]
    status: Optional[str] = None
    processor: Optional[str] = None
    handler: Optional[str] = None


class BatchVisitUpdate(BaseModel):
    ids: List[int]
    status: Optional[str] = None
    visitor: Optional[str] = None


class DashboardStats(BaseModel):
    pending_count: int
    in_progress_count: int
    rejected_count: int
    need_review_count: int
    lens_lost_count: int
    refunding_count: int
    visit_pending_count: int
    total_today: int


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[dict]
