from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Integer, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class InspectionItem(Base):
    __tablename__ = "inspection_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    inspection_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("inspections.id"), nullable=False
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    check_point: Mapped[str] = mapped_column(String(200), nullable=False)
    standard: Mapped[Optional[str]] = mapped_column(Text)
    result: Mapped[str] = mapped_column(String(20), default="pending")
    score: Mapped[Optional[float]] = mapped_column(Float)
    remark: Mapped[Optional[str]] = mapped_column(Text)
    photo_url: Mapped[Optional[str]] = mapped_column(Text)


class Inspection(Base):
    __tablename__ = "inspections"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id"), nullable=False
    )
    inspector_id: Mapped[str] = mapped_column(String(50), nullable=False)
    inspector_name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(30), default="routine")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    overall_score: Mapped[Optional[float]] = mapped_column(Float)
    summary: Mapped[Optional[str]] = mapped_column(Text)
    rectification_required: Mapped[bool] = mapped_column(
        Integer, default=False
    )
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
