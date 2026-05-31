from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, DateTime, Date, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id"), nullable=False
    )
    staff_id: Mapped[str] = mapped_column(String(50), nullable=False)
    staff_name: Mapped[str] = mapped_column(String(100), nullable=False)
    work_date: Mapped[date] = mapped_column(Date, nullable=False)
    shift_type: Mapped[str] = mapped_column(String(30), nullable=False)
    check_in_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    check_out_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    check_in_photo: Mapped[Optional[str]] = mapped_column(Text)
    check_out_photo: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="planned")
    remark: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
