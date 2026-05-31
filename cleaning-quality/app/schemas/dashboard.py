from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class DashboardStats(BaseModel):
    pending_rectifications: int
    overdue_rectifications: int
    rejected_rectifications: int
    pending_inspections: int
    in_progress_inspections: int
    low_stock_consumables: int
    pending_consumable_orders: int
    contracts_expiring_soon: int
    missed_check_ins_today: int


class DashboardItem(BaseModel):
    id: int
    title: str
    subtitle: Optional[str] = None
    status: str
    deadline: Optional[datetime] = None
    entity_type: str
    project_name: Optional[str] = None


class DashboardResponse(BaseModel):
    stats: DashboardStats
    pending_items: list[DashboardItem]
    rejected_items: list[DashboardItem]
    review_items: list[DashboardItem]
