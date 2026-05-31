from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ContractCreate(BaseModel):
    project_id: int
    contract_no: str = Field(..., max_length=100)
    start_date: datetime
    end_date: datetime
    amount: Optional[float] = None
    followup_date: Optional[datetime] = None
    remark: Optional[str] = None


class ContractFollowUp(BaseModel):
    followup_result: str
    followup_by: str = Field(..., max_length=50)
    followup_date: Optional[datetime] = None


class ContractUpdate(BaseModel):
    status: Optional[str] = None
    followup_date: Optional[datetime] = None
    remark: Optional[str] = None


class ContractOut(BaseModel):
    id: int
    project_id: int
    contract_no: str
    start_date: datetime
    end_date: datetime
    status: str
    amount: Optional[float] = None
    followup_date: Optional[datetime] = None
    followup_result: Optional[str] = None
    followup_by: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
