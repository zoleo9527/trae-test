from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    name = Column(String)
    role = Column(String)
    email = Column(String)
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    created_inspections = relationship("Inspection", back_populates="creator", foreign_keys="Inspection.created_by")
    assigned_inspections = relationship("Inspection", back_populates="assignee", foreign_keys="Inspection.assigned_to")
    created_rectifications = relationship("Rectification", back_populates="creator", foreign_keys="Rectification.created_by")
    assigned_rectifications = relationship("Rectification", back_populates="assignee", foreign_keys="Rectification.assigned_to")
    status_histories = relationship("StatusHistory", back_populates="operator")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    owner_name = Column(String)
    owner_phone = Column(String)
    stage = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inspections = relationship("Inspection", back_populates="project")


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String)
    type = Column(String)
    status = Column(String)
    priority = Column(String, default="normal")
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    inspection_date = Column(DateTime(timezone=True), nullable=True)
    signed_at = Column(DateTime(timezone=True), nullable=True)
    signed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="inspections")
    creator = relationship("User", back_populates="created_inspections", foreign_keys=[created_by])
    assignee = relationship("User", back_populates="assigned_inspections", foreign_keys=[assigned_to])
    issues = relationship("Issue", back_populates="inspection", cascade="all, delete-orphan")
    rectifications = relationship("Rectification", back_populates="inspection")
    status_histories = relationship("StatusHistory", back_populates="inspection")
    photos = relationship("Photo", back_populates="inspection", cascade="all, delete-orphan")


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    title = Column(String)
    description = Column(Text)
    category = Column(String)
    severity = Column(String)
    position = Column(String, nullable=True)
    is_rectified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inspection = relationship("Inspection", back_populates="issues")
    rectification_items = relationship("RectificationItem", back_populates="issue")


class Rectification(Base):
    __tablename__ = "rectifications"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    title = Column(String)
    status = Column(String)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_at = Column(DateTime(timezone=True), nullable=True)
    review_comment = Column(Text, nullable=True)
    signed_at = Column(DateTime(timezone=True), nullable=True)
    signed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    inspection = relationship("Inspection", back_populates="rectifications")
    creator = relationship("User", back_populates="created_rectifications", foreign_keys=[created_by])
    assignee = relationship("User", back_populates="assigned_rectifications", foreign_keys=[assigned_to])
    items = relationship("RectificationItem", back_populates="rectification", cascade="all, delete-orphan")
    status_histories = relationship("StatusHistory", back_populates="rectification")
    photos = relationship("Photo", back_populates="rectification", cascade="all, delete-orphan")


class RectificationItem(Base):
    __tablename__ = "rectification_items"

    id = Column(Integer, primary_key=True, index=True)
    rectification_id = Column(Integer, ForeignKey("rectifications.id"))
    issue_id = Column(Integer, ForeignKey("issues.id"))
    status = Column(String, default="pending")
    rectification_method = Column(Text, nullable=True)
    review_comment = Column(Text, nullable=True)
    actual_finish_date = Column(DateTime(timezone=True), nullable=True)
    cost = Column(Float, nullable=True)
    cost_confirmed = Column(Boolean, default=False)
    cost_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    cost_confirmed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    rectification = relationship("Rectification", back_populates="items")
    issue = relationship("Issue", back_populates="rectification_items")


class StatusHistory(Base):
    __tablename__ = "status_histories"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=True)
    rectification_id = Column(Integer, ForeignKey("rectifications.id"), nullable=True)
    from_status = Column(String, nullable=True)
    to_status = Column(String)
    comment = Column(Text, nullable=True)
    operator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inspection = relationship("Inspection", back_populates="status_histories")
    rectification = relationship("Rectification", back_populates="status_histories")
    operator = relationship("User", back_populates="status_histories")


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=True)
    rectification_id = Column(Integer, ForeignKey("rectifications.id"), nullable=True)
    url = Column(String)
    filename = Column(String)
    category = Column(String, nullable=True)
    description = Column(String, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inspection = relationship("Inspection", back_populates="photos")
    rectification = relationship("Rectification", back_populates="photos")
