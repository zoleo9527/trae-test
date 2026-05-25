from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class PerformanceBase(BaseModel):
    name: str
    troupe: str
    start_time: datetime
    end_time: datetime
    venue: str
    total_tickets: int = 0


class PerformanceCreate(PerformanceBase):
    pass


class PerformanceUpdate(BaseModel):
    name: Optional[str] = None
    troupe: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    venue: Optional[str] = None
    status: Optional[str] = None
    total_tickets: Optional[int] = None
    sold_tickets: Optional[int] = None


class Performance(PerformanceBase):
    id: int
    status: str
    sold_tickets: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ArtistBase(BaseModel):
    name: str
    role: Optional[str] = None
    troupe: Optional[str] = None
    phone: Optional[str] = None
    id_card: Optional[str] = None


class ArtistCreate(ArtistBase):
    pass


class Artist(ArtistBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReceptionArtistBase(BaseModel):
    artist_id: int
    check_in: bool = False
    room_number: Optional[str] = None


class ReceptionArtistCreate(ReceptionArtistBase):
    pass


class ReceptionArtist(ReceptionArtistBase):
    id: int
    artist: Artist

    class Config:
        from_attributes = True


class ReceptionBase(BaseModel):
    performance_id: int
    hotel: Optional[str] = None
    room_count: int = 0
    meal_count: int = 0
    transportation: Optional[str] = None
    notes: Optional[str] = None


class ReceptionCreate(ReceptionBase):
    artists: List[ReceptionArtistCreate] = []


class ReceptionUpdate(BaseModel):
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    hotel: Optional[str] = None
    room_count: Optional[int] = None
    meal_count: Optional[int] = None
    transportation: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class Reception(ReceptionBase):
    id: int
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    status: str
    created_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    artists: List[ReceptionArtist] = []
    performance: Performance

    class Config:
        from_attributes = True


class SettlementBase(BaseModel):
    performance_id: int
    performance_fee: float = 0
    hotel_expense: float = 0
    meal_expense: float = 0
    transportation_expense: float = 0
    other_expense: float = 0
    ticket_revenue: float = 0


class SettlementCreate(SettlementBase):
    pass


class SettlementUpdate(BaseModel):
    performance_fee: Optional[float] = None
    hotel_expense: Optional[float] = None
    meal_expense: Optional[float] = None
    transportation_expense: Optional[float] = None
    other_expense: Optional[float] = None
    ticket_revenue: Optional[float] = None
    status: Optional[str] = None
    approver: Optional[str] = None
    approval_notes: Optional[str] = None


class Settlement(SettlementBase):
    id: int
    total_amount: float
    status: str
    approver: Optional[str]
    approval_time: Optional[datetime]
    approval_notes: Optional[str]
    created_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    performance: Performance

    class Config:
        from_attributes = True


class StatusHistoryBase(BaseModel):
    performance_id: int
    entity_type: str
    entity_id: int
    old_status: str
    new_status: str
    changed_by: Optional[str] = None
    change_reason: Optional[str] = None


class StatusHistoryCreate(StatusHistoryBase):
    pass


class StatusHistory(StatusHistoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TicketOrderBase(BaseModel):
    performance_id: int
    customer_name: str
    customer_phone: str
    ticket_count: int = 1
    total_price: float = 0


class TicketOrderCreate(TicketOrderBase):
    pass


class TicketOrderUpdate(BaseModel):
    status: Optional[str] = None
    refund_reason: Optional[str] = None


class TicketOrder(TicketOrderBase):
    id: int
    order_no: str
    status: str
    refund_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    pending_receptions: int
    pending_settlements: int
    rejected_settlements: int
    need_review: int
    today_performances: int
    this_month_revenue: float


class TimelineItem(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    title: str
    old_status: str
    new_status: str
    changed_by: Optional[str]
    change_reason: Optional[str]
    created_at: datetime
