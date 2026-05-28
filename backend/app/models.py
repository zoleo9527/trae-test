from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, index=True)
    address = Column(String)
    type = Column(String, default="monthly")
    price_per_bucket = Column(Float, default=20.0)
    balance_buckets = Column(Integer, default=0)
    credit_limit = Column(Float, default=0)
    current_debt = Column(Float, default=0)
    status = Column(String, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    orders = relationship("Order", back_populates="customer")
    payments = relationship("Payment", back_populates="customer")
    reminders = relationship("PaymentReminder", back_populates="customer")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    order_no = Column(String, unique=True, index=True)
    buckets_delivered = Column(Integer, default=0)
    buckets_returned = Column(Integer, default=0)
    delivery_route = Column(String)
    delivery_person = Column(String)
    sign_photo_url = Column(String)
    sign_by = Column(String)
    sign_time = Column(DateTime(timezone=True))
    status = Column(String, default="pending")
    delivery_date = Column(DateTime(timezone=True))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    customer = relationship("Customer", back_populates="orders")
    exceptions = relationship("OrderException", back_populates="order")
    logs = relationship("OperationLog", back_populates="order")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    amount = Column(Float)
    payment_method = Column(String)
    payment_date = Column(DateTime(timezone=True))
    remark = Column(Text)
    operator = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="payments")


class PaymentReminder(Base):
    __tablename__ = "payment_reminders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    amount_due = Column(Float)
    due_date = Column(DateTime(timezone=True))
    status = Column(String, default="pending")
    reminder_count = Column(Integer, default=0)
    last_reminder_time = Column(DateTime(timezone=True))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    customer = relationship("Customer", back_populates="reminders")


class OrderException(Base):
    __tablename__ = "order_exceptions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    type = Column(String)
    description = Column(Text)
    status = Column(String, default="pending")
    reported_by = Column(String)
    handled_by = Column(String)
    handled_at = Column(DateTime(timezone=True))
    handle_result = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="exceptions")


class OperationLog(Base):
    __tablename__ = "operation_logs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    customer_id = Column(Integer, nullable=True)
    operator = Column(String)
    action = Column(String)
    old_value = Column(Text)
    new_value = Column(Text)
    ip_address = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="logs")
