from typing import Optional
from pydantic import BaseModel


class OperatorContext(BaseModel):
    operator_id: str
    operator_name: str
    operator_role: str
