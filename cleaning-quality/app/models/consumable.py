from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Consumable(Base):
    __tablename__ = "consumables"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    unit: Mapped[str] = mapped_column(String(30), nullable=False)
    current_stock: Mapped[float] = mapped_column(Float, default=0)
    threshold: Mapped[float] = mapped_column(Float, default=10)
    status: Mapped[str] = mapped_column(String(20), default="normal")
    last_restock_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    remark: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class ConsumableOrder(Base):
    __tablename__ = "consumable_orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    consumable_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("consumables.id"), nullable=False
    )
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id"), nullable=False
    )
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    requester_id: Mapped[str] = mapped_column(String(50), nullable=False)
    requester_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    approved_by: Mapped[Optional[str]] = mapped_column(String(50))
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    fulfilled_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    remark: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
