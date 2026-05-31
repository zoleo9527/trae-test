from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class InspectionItemCreate(BaseModel):
    category: str = Field(..., max_length=100)
    check_point: str = Field(..., max_length=200)
    standard: Optional[str] = None


class InspectionItemOut(BaseModel):
    id: int
    inspection_id: int
    category: str
    check_point: str
    standard: Optional[str] = None
    result: str
    score: Optional[float] = None
    remark: Optional[str] = None
    photo_url: Optional[str] = None

    model_config = {"from_attributes": True}


class InspectionItemScore(BaseModel):
    result: str = Field(..., max_length=20)
    score: Optional[float] = None
    remark: Optional[str] = None
    photo_url: Optional[str] = None


class InspectionCreate(BaseModel):
    project_id: int
    inspector_id: str = Field(..., max_length=50)
    inspector_name: str = Field(..., max_length=100)
    type: str = Field(default="routine", max_length=30)
    scheduled_at: Optional[datetime] = None
    items: list[InspectionItemCreate] = []


class InspectionUpdate(BaseModel):
    status: Optional[str] = None
    overall_score: Optional[float] = None
    summary: Optional[str] = None
    rectification_required: Optional[bool] = None
    completed_at: Optional[datetime] = None


class InspectionOut(BaseModel):
    id: int
    project_id: int
    inspector_id: str
    inspector_name: str
    type: str
    status: str
    overall_score: Optional[float] = None
    summary: Optional[str] = None
    rectification_required: bool
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    items: list[InspectionItemOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
