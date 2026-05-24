from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    name: str
    role: str
    email: Optional[str] = None


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    name: str
    address: str
    owner_name: str
    owner_phone: str
    stage: str


class ProjectCreate(ProjectBase):
    pass


class Project(ProjectBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class IssueBase(BaseModel):
    title: str
    description: str
    category: str
    severity: str
    position: Optional[str] = None


class IssueCreate(IssueBase):
    pass


class Issue(IssueBase):
    id: int
    inspection_id: int
    is_rectified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PhotoBase(BaseModel):
    url: str
    filename: str
    category: Optional[str] = None
    description: Optional[str] = None


class PhotoCreate(PhotoBase):
    uploaded_by: int


class Photo(PhotoBase):
    id: int
    uploaded_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class StatusHistoryBase(BaseModel):
    from_status: Optional[str] = None
    to_status: str
    comment: Optional[str] = None


class StatusHistoryCreate(StatusHistoryBase):
    operator_id: int


class StatusHistory(StatusHistoryBase):
    id: int
    operator: User
    created_at: datetime

    class Config:
        from_attributes = True


class RectificationItemBase(BaseModel):
    issue_id: int
    status: str = "pending"
    rectification_method: Optional[str] = None
    review_comment: Optional[str] = None
    cost: Optional[float] = None
    cost_confirmed: bool = False


class RectificationItemCreate(RectificationItemBase):
    pass


class RectificationItem(RectificationItemBase):
    id: int
    rectification_id: int
    issue: Issue
    actual_finish_date: Optional[datetime] = None
    cost_confirmed_at: Optional[datetime] = None
    cost_confirmed_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RectificationBase(BaseModel):
    title: str
    status: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    assigned_to: Optional[int] = None


class RectificationCreate(RectificationBase):
    inspection_id: int
    items: List[RectificationItemCreate]


class Rectification(RectificationBase):
    id: int
    inspection_id: int
    created_by: int
    creator: User
    assignee: Optional[User] = None
    review_by: Optional[int] = None
    review_at: Optional[datetime] = None
    review_comment: Optional[str] = None
    signed_at: Optional[datetime] = None
    signed_by: Optional[int] = None
    version: int
    items: List[RectificationItem] = []
    status_histories: List[StatusHistory] = []
    photos: List[Photo] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InspectionBase(BaseModel):
    title: str
    type: str
    status: str
    priority: str = "normal"
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    inspection_date: Optional[datetime] = None


class InspectionCreate(InspectionBase):
    project_id: int
    issues: List[IssueCreate] = []


class Inspection(InspectionBase):
    id: int
    project_id: int
    project: Project
    created_by: int
    creator: User
    assignee: Optional[User] = None
    signed_at: Optional[datetime] = None
    signed_by: Optional[int] = None
    version: int
    issues: List[Issue] = []
    rectifications: List[Rectification] = []
    status_histories: List[StatusHistory] = []
    photos: List[Photo] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StatusUpdate(BaseModel):
    status: str
    comment: Optional[str] = None
    operator_id: int


class BatchStatusUpdate(BaseModel):
    ids: List[int]
    status: str
    comment: Optional[str] = None
    operator_id: int


class CostConfirm(BaseModel):
    cost: float
    operator_id: int


class ReviewRectification(BaseModel):
    status: str
    review_comment: Optional[str] = None
    operator_id: int
    item_results: Optional[dict] = None
