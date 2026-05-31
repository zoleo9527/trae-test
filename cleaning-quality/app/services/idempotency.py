from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.idempotency import IdempotencyKey


class DuplicateSubmissionError(Exception):
    def __init__(self, key: str, entity_type: str, entity_id: Optional[int] = None):
        self.key = key
        self.entity_type = entity_type
        self.entity_id = entity_id
        super().__init__(
            f"检测到重复提交: 幂等键 {key} 已存在，请使用新的幂等键重试"
        )


def check_idempotency(
    db: Session,
    key: str,
    entity_type: str,
    operator_id: str,
    ttl_hours: int = 24,
) -> Optional[IdempotencyKey]:
    if not key:
        return None
    existing = db.query(IdempotencyKey).filter(
        IdempotencyKey.idempotency_key == key
    ).first()
    if existing:
        if existing.expires_at > datetime.utcnow():
            raise DuplicateSubmissionError(key, entity_type, existing.entity_id)
        else:
            db.delete(existing)
            db.flush()
    return None


def create_idempotency_record(
    db: Session,
    key: str,
    entity_type: str,
    entity_id: int,
    operator_id: str,
    result_data: Optional[str] = None,
    ttl_hours: int = 24,
) -> IdempotencyKey:
    if not key:
        return None
    record = IdempotencyKey(
        idempotency_key=key,
        entity_type=entity_type,
        entity_id=entity_id,
        result_data=result_data,
        operator_id=operator_id,
        expires_at=datetime.utcnow() + timedelta(hours=ttl_hours),
    )
    db.add(record)
    db.flush()
    return record
