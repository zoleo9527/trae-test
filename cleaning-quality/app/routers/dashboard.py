from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.dashboard import DashboardResponse
from app.schemas.audit_log import AuditLogOut
from app.services.dashboard import get_dashboard
from app.services.audit import query_audit_logs

router = APIRouter(tags=["首页与审计"])


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(db: Session = Depends(get_db)):
    return get_dashboard(db)


@router.get("/audit-logs", response_model=list[AuditLogOut])
def list_audit_logs(
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    operator_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return query_audit_logs(db, entity_type, entity_id, operator_id, action, limit, offset)
