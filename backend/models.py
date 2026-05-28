from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship

from database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(32), unique=True, index=True, nullable=False)
    customer_name = Column(String(64), nullable=False)
    partner_name = Column(String(64), default="")
    phone = Column(String(32), default="")
    studio_branch = Column(String(64), default="总店")
    package = Column(String(128), default="")
    shoot_date = Column(DateTime, nullable=True)
    select_date = Column(DateTime, nullable=True)
    store_manager = Column(String(32), default="")
    selector = Column(String(32), default="")
    retoucher = Column(String(32), default="")
    customer_service = Column(String(32), default="")
    remark = Column(Text, default="")
    balance_status = Column(String(16), default="未结清")  # 未结清 / 已结清
    status = Column(String(16), default="已拍摄")  # 已拍摄 / 选片中 / 修片中 / 复核中 / 已完成 / 已归档
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    batches = relationship("Batch", back_populates="order", cascade="all, delete-orphan")
    timeline = relationship("TimelineEvent", back_populates="order", cascade="all, delete-orphan")


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    batch_no = Column(Integer, nullable=False, default=1)  # 第几次回传
    status = Column(String(16), default="待复核")  # 待复核 / 复核中 / 已驳回 / 已通过 / 已回查
    delivered_at = Column(DateTime, default=datetime.utcnow)
    remark = Column(Text, default="")

    order = relationship("Order", back_populates="batches")
    photos = relationship("Photo", back_populates="batch", cascade="all, delete-orphan")


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False, index=True)
    photo_name = Column(String(128), nullable=False)
    category = Column(String(32), default="主纱")
    image_url = Column(String(255), default="")
    version = Column(Integer, default=1)
    review_status = Column(String(16), default="待复核")
    latest_feedback = Column(Text, default="")
    source_photo_id = Column(Integer, ForeignKey("photos.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    batch = relationship("Batch", back_populates="photos")
    reviews = relationship("Review", back_populates="photo", cascade="all, delete-orphan")
    source_photo = relationship("Photo", remote_side=[id], foreign_keys=[source_photo_id])


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    photo_id = Column(Integer, ForeignKey("photos.id"), nullable=False, index=True)
    reviewer = Column(String(32), default="客户")  # 客户 / 选片师 / 店长
    verdict = Column(String(16), nullable=False)  # 通过 / 驳回 / 回查
    feedback = Column(Text, default="")
    version_at_review = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    photo = relationship("Photo", back_populates="reviews")


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    event_type = Column(String(32), nullable=False)  # 拍摄 / 选片 / 回传 / 复核 / 回查 / 改期 / 尾款
    title = Column(String(128), nullable=False)
    detail = Column(Text, default="")
    operator = Column(String(32), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="timeline")
