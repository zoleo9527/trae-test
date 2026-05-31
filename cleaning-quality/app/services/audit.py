from typing import Optional
import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log_audit(
    db: Session,
    entity_type: str,
    entity_id: int,
    action: str,
    operator_id: str,
    operator_name: str,
    operator_role: str,
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None,
    detail: Optional[str] = None,
) -> AuditLog:
    entry = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        old_values=json.dumps(old_values, ensure_ascii=False, default=str) if old_values else None,
        new_values=json.dumps(new_values, ensure_ascii=False, default=str) if new_values else None,
        operator_id=operator_id,
        operator_name=operator_name,
        operator_role=operator_role,
        detail=detail,
        created_at=datetime.utcnow(),
    )
    db.add(entry)
    db.flush()
    return entry


def query_audit_logs(
    db: Session,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    operator_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> list[AuditLog]:
    q = db.query(AuditLog)
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)
    if entity_id is not None:
        q = q.filter(AuditLog.entity_id == entity_id)
    if operator_id:
        q = q.filter(AuditLog.operator_id == operator_id)
    if action:
        q = q.filter(AuditLog.action == action)
    return q.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
