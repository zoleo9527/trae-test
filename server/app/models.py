from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, Float, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class RepairsStatus(str, enum.Enum):
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


class LensStatus(str, enum.Enum):
    IN_STOCK = "库存充足"
    LOW_STOCK = "库存不足"
    TRANSFERRING = "调拨中"
    LOST = "已丢失"
    REPLACED = "已补货"


class VisitStatus(str, enum.Enum):
    PENDING = "待回访"
    COMPLETED = "已回访"
    FAILED = "回访失败"
    RESCHEDULED = "已改期"


class Role(str, enum.Enum):
    OPTOMETRIST = "验光师"
    PROCESSOR = "加工员"
    AFTER_SALES = "售后员"
    STORE_MANAGER = "店长"


class OptometryOrder(Base):
    __tablename__ = "optometry_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20))
    store_name = Column(String(100), nullable=False)
    optometrist = Column(String(100), nullable=False)
    exam_date = Column(Date, nullable=False, default=date.today)

    left_sph = Column(Float)
    left_cyl = Column(Float)
    left_axis = Column(Integer)
    right_sph = Column(Float)
    right_cyl = Column(Float)
    right_axis = Column(Integer)
    pd = Column(Float)

    lens_type = Column(String(100))
    lens_brand = Column(String(100))
    frame_model = Column(String(100))

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    repairs = relationship("RepairOrder", back_populates="optometry_order")


class RepairOrder(Base):
    __tablename__ = "repair_orders"

    id = Column(Integer, primary_key=True, index=True)
    repair_no = Column(String(50), unique=True, index=True, nullable=False)
    optometry_order_id = Column(Integer, ForeignKey("optometry_orders.id"))
    optometry_order_no = Column(String(50))
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20))
    store_name = Column(String(100), nullable=False)

    repair_type = Column(String(50), nullable=False)
    repair_reason = Column(Text, nullable=False)
    processor = Column(String(100))
    handler = Column(String(100))

    status = Column(String(20), default=RepairsStatus.PENDING.value, nullable=False)
    priority = Column(String(20), default="普通")

    lens_status = Column(String(20), default=LensStatus.IN_STOCK.value)
    lens_transfer_no = Column(String(50))

    reject_reason = Column(Text)
    refund_amount = Column(Float)
    refund_reason = Column(Text)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    completed_at = Column(DateTime)

    optometry_order = relationship("OptometryOrder", back_populates="repairs")
    status_history = relationship("StatusHistory", back_populates="repair_order", cascade="all, delete-orphan")
    lens_transfers = relationship("LensTransfer", back_populates="repair_order", cascade="all, delete-orphan")
    refunds = relationship("RefundRecord", back_populates="repair_order", cascade="all, delete-orphan")
    visits = relationship("VisitRecord", back_populates="repair_order", cascade="all, delete-orphan")


class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    repair_order_id = Column(Integer, ForeignKey("repair_orders.id"), nullable=False)
    from_status = Column(String(20))
    to_status = Column(String(20), nullable=False)
    changed_by = Column(String(100), nullable=False)
    change_reason = Column(Text)
    changed_at = Column(DateTime, default=datetime.now)

    repair_order = relationship("RepairOrder", back_populates="status_history")


class LensTransfer(Base):
    __tablename__ = "lens_transfers"

    id = Column(Integer, primary_key=True, index=True)
    repair_order_id = Column(Integer, ForeignKey("repair_orders.id"), nullable=False)
    transfer_no = Column(String(50), unique=True, index=True, nullable=False)
    from_store = Column(String(100), nullable=False)
    to_store = Column(String(100), nullable=False)
    lens_spec = Column(String(200), nullable=False)
    quantity = Column(Integer, default=1)

    status = Column(String(20), default="待发货")
    sent_at = Column(DateTime)
    received_at = Column(DateTime)
    is_lost = Column(Integer, default=0)
    lost_reason = Column(Text)
    remark = Column(Text)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    repair_order = relationship("RepairOrder", back_populates="lens_transfers")


class RefundRecord(Base):
    __tablename__ = "refund_records"

    id = Column(Integer, primary_key=True, index=True)
    repair_order_id = Column(Integer, ForeignKey("repair_orders.id"), nullable=False)
    refund_no = Column(String(50), unique=True, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    applicant = Column(String(100), nullable=False)
    approver = Column(String(100))
    status = Column(String(20), default="待审批")

    approved_at = Column(DateTime)
    rejected_at = Column(DateTime)
    reject_reason = Column(Text)
    paid_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    repair_order = relationship("RepairOrder", back_populates="refunds")


class VisitRecord(Base):
    __tablename__ = "visit_records"

    id = Column(Integer, primary_key=True, index=True)
    repair_order_id = Column(Integer, ForeignKey("repair_orders.id"), nullable=False)
    visit_no = Column(String(50), unique=True, index=True, nullable=False)
    visit_type = Column(String(50), nullable=False)
    planned_date = Column(Date, nullable=False)
    actual_date = Column(Date)
    visitor = Column(String(100))
    content = Column(Text)
    result = Column(String(20))
    customer_feedback = Column(Text)

    status = Column(String(20), default=VisitStatus.PENDING.value)
    next_visit_date = Column(Date)
    remark = Column(Text)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    repair_order = relationship("RepairOrder", back_populates="visits")


class DashboardCache(Base):
    __tablename__ = "dashboard_cache"

    id = Column(Integer, primary_key=True, index=True)
    cache_key = Column(String(100), unique=True, nullable=False)
    cache_value = Column(Text)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
