from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ConsumableCreate(BaseModel):
    project_id: int
    name: str = Field(..., max_length=200)
    unit: str = Field(..., max_length=30)
    current_stock: float = 0
    threshold: float = 10
    remark: Optional[str] = None


class ConsumableUpdate(BaseModel):
    name: Optional[str] = None
    current_stock: Optional[float] = None
    threshold: Optional[float] = None
    status: Optional[str] = None
    remark: Optional[str] = None


class ConsumableOut(BaseModel):
    id: int
    project_id: int
    name: str
    unit: str
    current_stock: float
    threshold: float
    status: str
    last_restock_date: Optional[datetime] = None
    remark: Optional[str] = None
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConsumableOrderCreate(BaseModel):
    consumable_id: int
    project_id: int
    quantity: float
    requester_id: str = Field(..., max_length=50)
    requester_name: str = Field(..., max_length=100)
    remark: Optional[str] = None


class ConsumableOrderApprove(BaseModel):
    approved_by: str = Field(..., max_length=50)


class ConsumableOrderOut(BaseModel):
    id: int
    consumable_id: int
    project_id: int
    quantity: float
    requester_id: str
    requester_name: str
    status: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    fulfilled_at: Optional[datetime] = None
    remark: Optional[str] = None
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
