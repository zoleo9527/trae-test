from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    role: str
    name: str


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: User


class ProjectBase(BaseModel):
    name: str
    location: str
    total_area: float
    start_date: datetime
    expected_end_date: datetime
    manager_id: int


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    actual_end_date: Optional[datetime] = None


class Project(ProjectBase):
    id: int
    status: str
    actual_end_date: Optional[datetime] = None
    manager: Optional[User] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TeamBase(BaseModel):
    name: str
    leader_name: str
    leader_phone: str
    team_type: str


class TeamCreate(TeamBase):
    pass


class Team(TeamBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ConstructionDiaryBase(BaseModel):
    project_id: int
    team_id: int
    report_date: datetime
    weather: str
    construction_content: str
    completed_area: float
    worker_count: int
    work_hours: float
    material_used: str
    problems: Optional[str] = None
    is_exception: bool = False
    exception_type: Optional[str] = None
    exception_reason: Optional[str] = None


class ConstructionDiaryCreate(ConstructionDiaryBase):
    created_by: int


class ConstructionDiaryUpdate(BaseModel):
    status: Optional[str] = None
    is_exception: Optional[bool] = None
    exception_type: Optional[str] = None
    exception_reason: Optional[str] = None
    exception_handled: Optional[bool] = None
    exception_handler_id: Optional[int] = None
    exception_handle_note: Optional[str] = None
    exception_handled_at: Optional[datetime] = None


class ConstructionDiary(ConstructionDiaryBase):
    id: int
    status: str
    exception_handled: bool
    exception_handler_id: Optional[int] = None
    exception_handle_note: Optional[str] = None
    exception_handled_at: Optional[datetime] = None
    created_by: int
    created_at: datetime
    project: Optional[Project] = None
    team: Optional[Team] = None

    class Config:
        from_attributes = True


class QualityInspectionBase(BaseModel):
    project_id: int
    diary_id: int
    inspector_id: int
    inspection_date: datetime
    inspection_items: str
    inspection_result: str
    issues_found: Optional[str] = None
    rework_required: bool = False
    rework_reason: Optional[str] = None
    rework_area: float = 0
    material_wasted: Optional[str] = None
    rectification_deadline: Optional[datetime] = None


class QualityInspectionCreate(QualityInspectionBase):
    pass


class QualityInspectionUpdate(BaseModel):
    inspection_result: Optional[str] = None
    issues_found: Optional[str] = None
    rework_required: Optional[bool] = None
    rework_reason: Optional[str] = None
    rework_area: Optional[float] = None
    material_wasted: Optional[str] = None
    rectification_deadline: Optional[datetime] = None
    rectification_completed: Optional[bool] = None
    rectification_note: Optional[str] = None
    rectification_date: Optional[datetime] = None
    reinspection_result: Optional[str] = None
    status: Optional[str] = None


class QualityInspection(QualityInspectionBase):
    id: int
    rectification_completed: bool
    rectification_note: Optional[str] = None
    rectification_date: Optional[datetime] = None
    reinspection_result: Optional[str] = None
    status: str
    created_at: datetime
    inspector: Optional[User] = None
    diary: Optional[ConstructionDiary] = None

    class Config:
        from_attributes = True


class MaterialDeliveryBase(BaseModel):
    project_id: int
    delivery_date: datetime
    material_name: str
    specification: str
    planned_quantity: float
    actual_quantity: float
    unit: str
    batch_number: Optional[str] = None
    supplier: str
    receiver_id: int
    has_quality_issue: bool = False
    quality_issue_note: Optional[str] = None
    return_quantity: float = 0


class MaterialDeliveryCreate(MaterialDeliveryBase):
    pass


class MaterialDeliveryUpdate(BaseModel):
    has_quality_issue: Optional[bool] = None
    quality_issue_note: Optional[str] = None
    return_quantity: Optional[float] = None
    status: Optional[str] = None


class MaterialDelivery(MaterialDeliveryBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChangeOrderBase(BaseModel):
    project_id: int
    change_content: str
    change_reason: str
    area_change: float = 0
    cost_change: float = 0
    applicant_id: int


class ChangeOrderCreate(ChangeOrderBase):
    pass


class ChangeOrderUpdate(BaseModel):
    approval_status: Optional[str] = None
    approval_note: Optional[str] = None
    approver_id: Optional[int] = None
    approved_at: Optional[datetime] = None


class ChangeOrder(ChangeOrderBase):
    id: int
    approval_status: str
    approval_note: Optional[str] = None
    approver_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SettlementDeductionDetailBase(BaseModel):
    settlement_id: int
    deduction_type: str
    source_type: str
    source_id: int
    description: str
    amount: float = 0
    area: float = 0


class SettlementDeductionDetailCreate(SettlementDeductionDetailBase):
    pass


class SettlementDeductionDetail(SettlementDeductionDetailBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TeamSettlementBase(BaseModel):
    project_id: int
    team_id: int
    settlement_period: str
    total_completed_area: float
    unit_price: float
    base_amount: float
    rework_deduction: float = 0
    material_loss_deduction: float = 0
    other_adjustment: float = 0
    final_amount: float = 0
    settlement_note: Optional[str] = None
    has_dispute: bool = False
    dispute_reason: Optional[str] = None
    created_by: int


class TeamSettlementCreate(TeamSettlementBase):
    pass


class TeamSettlementUpdate(BaseModel):
    rework_deduction: Optional[float] = None
    material_loss_deduction: Optional[float] = None
    other_adjustment: Optional[float] = None
    final_amount: Optional[float] = None
    settlement_note: Optional[str] = None
    has_dispute: Optional[bool] = None
    dispute_reason: Optional[str] = None
    dispute_resolved: Optional[bool] = None
    dispute_resolution: Optional[str] = None
    status: Optional[str] = None


class TeamSettlement(TeamSettlementBase):
    id: int
    dispute_resolved: bool
    dispute_resolution: Optional[str] = None
    status: str
    created_at: datetime
    team: Optional[Team] = None
    deduction_details: Optional[List[SettlementDeductionDetail]] = None

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_projects: int
    in_progress_projects: int
    pending_inspections: int
    exception_count: int
    pending_settlements: int
    total_completed_area: float


class ExceptionItem(BaseModel):
    id: int
    type: str
    source: str
    source_id: int
    title: str
    description: str
    status: str
    created_at: datetime
    project_name: str
