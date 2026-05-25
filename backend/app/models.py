from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Performance(Base):
    __tablename__ = "performances"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    troupe = Column(String(100), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    venue = Column(String(100), nullable=False)
    status = Column(String(50), default="scheduled")
    total_tickets = Column(Integer, default=0)
    sold_tickets = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    receptions = relationship("Reception", back_populates="performance")
    settlements = relationship("Settlement", back_populates="performance")
    history = relationship("StatusHistory", back_populates="performance")
    ticket_orders = relationship("TicketOrder", back_populates="performance")


class Artist(Base):
    __tablename__ = "artists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(100))
    troupe = Column(String(100))
    phone = Column(String(50))
    id_card = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    receptions = relationship("ReceptionArtist", back_populates="artist")


class Reception(Base):
    __tablename__ = "receptions"

    id = Column(Integer, primary_key=True, index=True)
    performance_id = Column(Integer, ForeignKey("performances.id"))
    check_in_time = Column(DateTime)
    check_out_time = Column(DateTime)
    hotel = Column(String(200))
    room_count = Column(Integer, default=0)
    meal_count = Column(Integer, default=0)
    transportation = Column(String(200))
    notes = Column(Text)
    status = Column(String(50), default="pending")
    created_by = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    performance = relationship("Performance", back_populates="receptions")
    artists = relationship("ReceptionArtist", back_populates="reception")


class ReceptionArtist(Base):
    __tablename__ = "reception_artists"

    id = Column(Integer, primary_key=True, index=True)
    reception_id = Column(Integer, ForeignKey("receptions.id"))
    artist_id = Column(Integer, ForeignKey("artists.id"))
    check_in = Column(Boolean, default=False)
    room_number = Column(String(50))

    reception = relationship("Reception", back_populates="artists")
    artist = relationship("Artist", back_populates="receptions")


class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(Integer, primary_key=True, index=True)
    performance_id = Column(Integer, ForeignKey("performances.id"))
    performance_fee = Column(Float, default=0)
    hotel_expense = Column(Float, default=0)
    meal_expense = Column(Float, default=0)
    transportation_expense = Column(Float, default=0)
    other_expense = Column(Float, default=0)
    total_amount = Column(Float, default=0)
    ticket_revenue = Column(Float, default=0)
    status = Column(String(50), default="pending")
    approver = Column(String(100))
    approval_time = Column(DateTime)
    approval_notes = Column(Text)
    created_by = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    performance = relationship("Performance", back_populates="settlements")


class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    performance_id = Column(Integer, ForeignKey("performances.id"))
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    old_status = Column(String(50))
    new_status = Column(String(50))
    changed_by = Column(String(100))
    change_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    performance = relationship("Performance", back_populates="history")


class TicketOrder(Base):
    __tablename__ = "ticket_orders"

    id = Column(Integer, primary_key=True, index=True)
    performance_id = Column(Integer, ForeignKey("performances.id"))
    order_no = Column(String(100), unique=True)
    customer_name = Column(String(100))
    customer_phone = Column(String(50))
    ticket_count = Column(Integer, default=1)
    total_price = Column(Float, default=0)
    status = Column(String(50), default="confirmed")
    refund_reason = Column(Text)
    refund_applicant = Column(String(100))
    refund_approver = Column(String(100))
    refund_approval_time = Column(DateTime)
    refund_approval_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    performance = relationship("Performance", back_populates="ticket_orders")
