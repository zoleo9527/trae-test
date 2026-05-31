from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    action: str
    old_values: Optional[str] = None
    new_values: Optional[str] = None
    operator_id: str
    operator_name: str
    operator_role: str
    detail: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
