from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    display_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    orders_as_sales = relationship("Order", back_populates="sales_consultant_ref", foreign_keys="Order.sales_consultant_id")
    orders_as_manager = relationship("Order", back_populates="showroom_manager_ref", foreign_keys="Order.showroom_manager_id")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(30), unique=True, nullable=False, index=True)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(30), nullable=False)
    customer_address = Column(String(300), nullable=False)
    total_amount = Column(Float, default=0)
    deposit_amount = Column(Float, default=0)
    status = Column(String(30), nullable=False, default="pending")
    sales_consultant_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    showroom_manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    expected_delivery_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    remarks = Column(Text, nullable=True)

    sales_consultant_ref = relationship("User", back_populates="orders_as_sales", foreign_keys=[sales_consultant_id])
    showroom_manager_ref = relationship("User", back_populates="orders_as_manager", foreign_keys=[showroom_manager_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    configs = relationship("OrderConfig", back_populates="order", cascade="all, delete-orphan")
    arrivals = relationship("Arrival", back_populates="order", cascade="all, delete-orphan")
    installations = relationship("Installation", back_populates="order", cascade="all, delete-orphan")
    sample_lendings = relationship("SampleLending", back_populates="order", cascade="all, delete-orphan")
    replacement_parts = relationship("ReplacementPart", back_populates="order", cascade="all, delete-orphan")
    timeline = relationship("OrderTimeline", back_populates="order", cascade="all, delete-orphan", order_by="OrderTimeline.event_time")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_name = Column(String(200), nullable=False)
    product_code = Column(String(50), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0)
    subtotal = Column(Float, default=0)
    status = Column(String(30), nullable=False, default="pending")
    remarks = Column(Text, nullable=True)

    order = relationship("Order", back_populates="items")
    configs = relationship("OrderConfig", back_populates="item", cascade="all, delete-orphan")
    arrivals = relationship("Arrival", back_populates="item", cascade="all, delete-orphan")
    installations = relationship("Installation", back_populates="item", cascade="all, delete-orphan")
    replacement_parts = relationship("ReplacementPart", back_populates="item", cascade="all, delete-orphan")


class OrderConfig(Base):
    __tablename__ = "order_configs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("order_items.id"), nullable=True)
    config_type = Column(String(30), nullable=False)
    config_key = Column(String(100), nullable=False)
    config_value = Column(String(300), nullable=False)
    config_description = Column(Text, nullable=True)
    confirmed = Column(Boolean, default=False)
    confirmed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    confirmed_at = Column(DateTime, nullable=True)

    order = relationship("Order", back_populates="configs")
    item = relationship("OrderItem", back_populates="configs")


class Arrival(Base):
    __tablename__ = "arrivals"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("order_items.id"), nullable=True)
    arrival_date = Column(DateTime, nullable=False)
    quantity = Column(Integer, default=1)
    tracking_no = Column(String(100), nullable=True)
    status = Column(String(30), nullable=False, default="arrived")
    received_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    warehouse_location = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    is_partial = Column(Boolean, default=False)
    damaged_qty = Column(Integer, default=0)
    missing_qty = Column(Integer, default=0)

    order = relationship("Order", back_populates="arrivals")
    item = relationship("OrderItem", back_populates="arrivals")


class Installation(Base):
    __tablename__ = "installations"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("order_items.id"), nullable=True)
    scheduled_date = Column(DateTime, nullable=False)
    installer = Column(String(100), nullable=False)
    contact_name = Column(String(100), nullable=False)
    contact_phone = Column(String(30), nullable=False)
    status = Column(String(30), nullable=False, default="scheduled")
    actual_start_date = Column(DateTime, nullable=True)
    actual_end_date = Column(DateTime, nullable=True)
    reschedule_count = Column(Integer, default=0)
    problem_description = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)

    order = relationship("Order", back_populates="installations")
    item = relationship("OrderItem", back_populates="installations")


class SampleLending(Base):
    __tablename__ = "sample_lendings"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    sample_name = Column(String(200), nullable=False)
    sample_code = Column(String(50), nullable=True)
    lent_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    lent_to = Column(String(100), nullable=False)
    lent_date = Column(DateTime, nullable=False, server_default=func.now())
    due_date = Column(DateTime, nullable=False)
    returned_date = Column(DateTime, nullable=True)
    status = Column(String(30), nullable=False, default="lent")
    condition = Column(String(30), nullable=True)
    remarks = Column(Text, nullable=True)

    order = relationship("Order", back_populates="sample_lendings")


class ReplacementPart(Base):
    __tablename__ = "replacement_parts"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("order_items.id"), nullable=True)
    part_name = Column(String(200), nullable=False)
    part_code = Column(String(50), nullable=True)
    quantity = Column(Integer, default=1)
    reason = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="pending")
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    requested_date = Column(DateTime, nullable=False, server_default=func.now())
    ordered_date = Column(DateTime, nullable=True)
    arrived_date = Column(DateTime, nullable=True)
    installed_date = Column(DateTime, nullable=True)
    confirmed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    confirmed_date = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)

    order = relationship("Order", back_populates="replacement_parts")
    item = relationship("OrderItem", back_populates="replacement_parts")


class OrderTimeline(Base):
    __tablename__ = "order_timelines"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    event_type = Column(String(50), nullable=False)
    event_description = Column(Text, nullable=False)
    event_time = Column(DateTime, nullable=False, server_default=func.now())
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    operator_name = Column(String(100), nullable=True)
    metadata_json = Column(Text, nullable=True)

    order = relationship("Order", back_populates="timeline")