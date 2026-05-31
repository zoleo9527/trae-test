from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class RectificationCreate(BaseModel):
    inspection_id: int
    project_id: int
    issue_description: str
    category: str = Field(..., max_length=100)
    severity: str = Field(default="medium", max_length=20)
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None
    deadline: Optional[datetime] = None


class RectificationAssign(BaseModel):
    assignee_id: str = Field(..., max_length=50)
    assignee_name: str = Field(..., max_length=100)
    deadline: Optional[datetime] = None


class RectificationSubmit(BaseModel):
    resolution: str
    resolution_photos: Optional[str] = None


class RectificationReview(BaseModel):
    action: str = Field(..., description="approved or rejected")
    reject_reason: Optional[str] = None


class RectificationOut(BaseModel):
    id: int
    inspection_id: int
    project_id: int
    issue_description: str
    category: str
    severity: str
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None
    status: str
    deadline: Optional[datetime] = None
    resolution: Optional[str] = None
    resolution_photos: Optional[str] = None
    reject_reason: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
