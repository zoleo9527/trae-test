from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    requested_orders = relationship("LiftingOrder", foreign_keys="LiftingOrder.requester_id", back_populates="requester")
    assigned_orders = relationship("LiftingOrder", foreign_keys="LiftingOrder.assignee_id", back_populates="assignee")
    checked_loadings = relationship("LoadingCheck", foreign_keys="LoadingCheck.checker_id", back_populates="checker")
    handled_exceptions = relationship("ExceptionRecord", foreign_keys="ExceptionRecord.handler_id", back_populates="handler")
    audit_logs = relationship("AuditLog", back_populates="user")


class Plot(Base):
    __tablename__ = "plots"

    id = Column(Integer, primary_key=True, index=True)
    plot_code = Column(String(20), unique=True, nullable=False)
    location = Column(String(200))
    seedling_type = Column(String(50), nullable=False)
    total_count = Column(Integer, nullable=False)
    available_count = Column(Integer, nullable=False)
    status = Column(String(20), default="在圃")
    remark = Column(Text)

    orders = relationship("LiftingOrder", back_populates="plot")


class LiftingOrder(Base):
    __tablename__ = "lifting_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(30), unique=True, nullable=False)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    seedling_type = Column(String(50), nullable=False)
    requested_count = Column(Integer, nullable=False)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="待确认")
    planned_date = Column(DateTime)
    completed_at = Column(DateTime)
    remark = Column(Text)

    plot = relationship("Plot", back_populates="orders")
    requester = relationship("User", foreign_keys=[requester_id], back_populates="requested_orders")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_orders")
    loading_checks = relationship("LoadingCheck", back_populates="order")


class LoadingCheck(Base):
    __tablename__ = "loading_checks"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("lifting_orders.id"), nullable=False)
    checker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    planned_qty = Column(Integer, nullable=False)
    actual_qty = Column(Integer)
    vehicle_no = Column(String(20))
    driver_name = Column(String(50))
    status = Column(String(20), default="待装车")
    loaded_at = Column(DateTime)
    remark = Column(Text)

    order = relationship("LiftingOrder", back_populates="loading_checks")
    checker = relationship("User", foreign_keys=[checker_id], back_populates="checked_loadings")


class ExceptionRecord(Base):
    __tablename__ = "exception_records"

    id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String(20), nullable=False)
    source_id = Column(Integer, nullable=False)
    exception_type = Column(String(20), nullable=False)
    severity = Column(String(20), nullable=False)
    description = Column(Text, nullable=False)
    handler_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default="待处理")
    resolution = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    handled_at = Column(DateTime)
    closed_at = Column(DateTime)

    handler = relationship("User", foreign_keys=[handler_id], back_populates="handled_exceptions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(Integer, nullable=False)
    detail = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
