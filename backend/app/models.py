from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password_hash = Column(String(255))
    role = Column(String(20))
    name = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    location = Column(String(200))
    total_area = Column(Float)
    start_date = Column(DateTime)
    expected_end_date = Column(DateTime)
    actual_end_date = Column(DateTime, nullable=True)
    status = Column(String(20), default="in_progress")
    manager_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    manager = relationship("User")
    construction_diaries = relationship("ConstructionDiary", back_populates="project")
    quality_inspections = relationship("QualityInspection", back_populates="project")
    material_deliveries = relationship("MaterialDelivery", back_populates="project")
    team_settlements = relationship("TeamSettlement", back_populates="project")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50))
    leader_name = Column(String(50))
    leader_phone = Column(String(20))
    team_type = Column(String(30))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    diaries = relationship("ConstructionDiary", back_populates="team")
    settlements = relationship("TeamSettlement", back_populates="team")


class ConstructionDiary(Base):
    __tablename__ = "construction_diaries"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    team_id = Column(Integer, ForeignKey("teams.id"))
    report_date = Column(DateTime)
    weather = Column(String(20))
    construction_content = Column(Text)
    completed_area = Column(Float, default=0)
    worker_count = Column(Integer, default=0)
    work_hours = Column(Float, default=0)
    material_used = Column(Text)
    problems = Column(Text, nullable=True)
    status = Column(String(20), default="submitted")
    is_exception = Column(Boolean, default=False)
    exception_type = Column(String(50), nullable=True)
    exception_reason = Column(Text, nullable=True)
    exception_handled = Column(Boolean, default=False)
    exception_handler_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    exception_handle_note = Column(Text, nullable=True)
    exception_handled_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="construction_diaries")
    team = relationship("Team", back_populates="diaries")
    creator = relationship("User", foreign_keys=[created_by])
    exception_handler = relationship("User", foreign_keys=[exception_handler_id])
    inspections = relationship("QualityInspection", back_populates="diary")


class QualityInspection(Base):
    __tablename__ = "quality_inspections"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    diary_id = Column(Integer, ForeignKey("construction_diaries.id"))
    inspector_id = Column(Integer, ForeignKey("users.id"))
    inspection_date = Column(DateTime)
    inspection_items = Column(Text)
    inspection_result = Column(String(20))
    issues_found = Column(Text, nullable=True)
    rework_required = Column(Boolean, default=False)
    rework_reason = Column(Text, nullable=True)
    rework_area = Column(Float, default=0)
    material_wasted = Column(Text, nullable=True)
    rectification_deadline = Column(DateTime, nullable=True)
    rectification_completed = Column(Boolean, default=False)
    rectification_note = Column(Text, nullable=True)
    rectification_date = Column(DateTime, nullable=True)
    reinspection_result = Column(String(20), nullable=True)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="quality_inspections")
    diary = relationship("ConstructionDiary", back_populates="inspections")
    inspector = relationship("User", foreign_keys=[inspector_id])


class MaterialDelivery(Base):
    __tablename__ = "material_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    delivery_date = Column(DateTime)
    material_name = Column(String(100))
    specification = Column(String(100))
    planned_quantity = Column(Float)
    actual_quantity = Column(Float)
    unit = Column(String(20))
    batch_number = Column(String(50), nullable=True)
    supplier = Column(String(100))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    has_quality_issue = Column(Boolean, default=False)
    quality_issue_note = Column(Text, nullable=True)
    return_quantity = Column(Float, default=0)
    status = Column(String(20), default="received")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="material_deliveries")
    receiver = relationship("User")


class ChangeOrder(Base):
    __tablename__ = "change_orders"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    change_content = Column(Text)
    change_reason = Column(Text)
    area_change = Column(Float, default=0)
    cost_change = Column(Float, default=0)
    applicant_id = Column(Integer, ForeignKey("users.id"))
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approval_status = Column(String(20), default="pending")
    approval_note = Column(Text, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SettlementDeductionDetail(Base):
    __tablename__ = "settlement_deduction_details"

    id = Column(Integer, primary_key=True, index=True)
    settlement_id = Column(Integer, ForeignKey("team_settlements.id"))
    deduction_type = Column(String(30))
    source_type = Column(String(30))
    source_id = Column(Integer)
    description = Column(Text)
    amount = Column(Float, default=0)
    area = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TeamSettlement(Base):
    __tablename__ = "team_settlements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    team_id = Column(Integer, ForeignKey("teams.id"))
    settlement_period = Column(String(50))
    total_completed_area = Column(Float, default=0)
    unit_price = Column(Float)
    base_amount = Column(Float, default=0)
    rework_deduction = Column(Float, default=0)
    material_loss_deduction = Column(Float, default=0)
    other_adjustment = Column(Float, default=0)
    final_amount = Column(Float, default=0)
    settlement_note = Column(Text, nullable=True)
    has_dispute = Column(Boolean, default=False)
    dispute_reason = Column(Text, nullable=True)
    dispute_resolved = Column(Boolean, default=False)
    dispute_resolution = Column(Text, nullable=True)
    status = Column(String(20), default="draft")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="team_settlements")
    team = relationship("Team", back_populates="settlements")
    deduction_details = relationship("SettlementDeductionDetail", backref="settlement")
