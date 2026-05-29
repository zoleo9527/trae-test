from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import AuditLog
from schemas import AuditLogResponse

router = APIRouter(prefix="/api/audit-logs", tags=["audit"])

@router.get("", response_model=list[AuditLogResponse])
def list_audit_logs(
    target_type: str = Query(None),
    target_id: int = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if target_type:
        query = query.filter(AuditLog.target_type == target_type)
    if target_id:
        query = query.filter(AuditLog.target_id == target_id)
    return query.order_by(AuditLog.created_at.desc()).limit(50).all()
