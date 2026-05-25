from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password = Column(String(100))
    role = Column(String(20))
    name = Column(String(50))
    department = Column(String(50))
    created_at = Column(DateTime, default=func.now())


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    isbn = Column(String(20), unique=True, index=True)
    title = Column(String(200))
    author = Column(String(100))
    publisher = Column(String(100))
    publish_date = Column(Date)
    price = Column(Float)
    category = Column(String(50))
    created_at = Column(DateTime, default=func.now())


class Channel(Base):
    __tablename__ = "channels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    type = Column(String(50))
    contact_person = Column(String(50))
    phone = Column(String(20))
    address = Column(String(200))
    payment_terms = Column(String(100))
    credit_limit = Column(Float)
    created_at = Column(DateTime, default=func.now())


class Distribution(Base):
    __tablename__ = "distributions"

    id = Column(Integer, primary_key=True, index=True)
    distribution_no = Column(String(50), unique=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"))
    channel_id = Column(Integer, ForeignKey("channels.id"))
    quantity = Column(Integer)
    sample_quantity = Column(Integer, default=0)
    distribution_date = Column(Date)
    status = Column(String(20), default="pending")
    receipt_status = Column(String(20), default="pending")
    receipt_date = Column(Date)
    tracking_no = Column(String(100))
    courier_company = Column(String(50))
    handler_id = Column(Integer, ForeignKey("users.id"))
    channel_manager_id = Column(Integer, ForeignKey("users.id"))
    remarks = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    book = relationship("Book")
    channel = relationship("Channel")
    handler = relationship("User", foreign_keys=[handler_id])
    channel_manager = relationship("User", foreign_keys=[channel_manager_id])
    returns = relationship("Return", back_populates="distribution")
    payments = relationship("Payment", back_populates="distribution")


class ChannelFeedback(Base):
    __tablename__ = "channel_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    distribution_id = Column(Integer, ForeignKey("distributions.id"))
    feedback_type = Column(String(20))
    feedback_date = Column(Date)
    sales_quantity = Column(Integer, default=0)
    feedback_content = Column(Text)
    feedback_by = Column(String(50))
    created_at = Column(DateTime, default=func.now())


class Return(Base):
    __tablename__ = "returns"

    id = Column(Integer, primary_key=True, index=True)
    return_no = Column(String(50), unique=True, index=True)
    distribution_id = Column(Integer, ForeignKey("distributions.id"))
    quantity = Column(Integer)
    return_date = Column(Date)
    return_reason = Column(String(200))
    return_type = Column(String(20))
    status = Column(String(20), default="pending")
    receive_status = Column(String(20), default="pending")
    receive_date = Column(Date)
    handler_id = Column(Integer, ForeignKey("users.id"))
    remarks = Column(Text)
    quantity_discrepancy = Column(Boolean, default=False)
    discrepancy_note = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    distribution = relationship("Distribution", back_populates="returns")
    handler = relationship("User")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_no = Column(String(50), unique=True, index=True)
    distribution_id = Column(Integer, ForeignKey("distributions.id"))
    channel_id = Column(Integer, ForeignKey("channels.id"))
    amount = Column(Float)
    payment_date = Column(Date)
    payment_method = Column(String(50))
    status = Column(String(20), default="pending")
    finance_confirm_id = Column(Integer, ForeignKey("users.id"))
    finance_confirm_date = Column(Date)
    remarks = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    distribution = relationship("Distribution", back_populates="payments")
    channel = relationship("Channel")
    finance_confirm = relationship("User")


class ExceptionRecord(Base):
    __tablename__ = "exception_records"

    id = Column(Integer, primary_key=True, index=True)
    related_type = Column(String(20))
    related_id = Column(Integer)
    exception_type = Column(String(50))
    description = Column(Text)
    status = Column(String(20), default="open")
    handler_id = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime)
    resolution = Column(Text)
    created_at = Column(DateTime, default=func.now())

    handler = relationship("User")
