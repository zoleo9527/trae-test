from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., max_length=200)
    code: str = Field(..., max_length=50)
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    is_active: Optional[bool] = None


class ProjectOut(BaseModel):
    id: int
    name: str
    code: str
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
