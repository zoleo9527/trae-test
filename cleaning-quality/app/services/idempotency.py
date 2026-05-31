from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.idempotency import IdempotencyKey


class DuplicateSubmissionError(Exception):
    def __init__(self, key: str, entity_type: str, operator_id: str, entity_id: Optional[int] = None):
        self.key = key
        self.entity_type = entity_type
        self.operator_id = operator_id
        self.entity_id = entity_id
        super().__init__(
            f"检测到重复提交: 操作人 {operator_id} 在 {entity_type} 下的幂等键 {key} 已存在，请使用新的幂等键重试"
        )


class MissingIdempotencyKeyError(Exception):
    def __init__(self, entity_type: str):
        self.entity_type = entity_type
        super().__init__(
            f"缺少幂等键: 请在请求头中提供 X-Idempotency-Key 用于 {entity_type} 操作的重复提交保护"
        )


class MissingExpectedVersionError(Exception):
    def __init__(self, entity_type: str, operation: str):
        self.entity_type = entity_type
        self.operation = operation
        super().__init__(
            f"缺少预期版本号: 请在请求头中提供 X-Expected-Version 用于 {entity_type} 的 {operation} 操作的并发控制"
        )


def check_idempotency(
    db: Session,
    key: str,
    entity_type: str,
    operator_id: str,
    ttl_hours: int = 24,
) -> Optional[IdempotencyKey]:
    if not key:
        raise MissingIdempotencyKeyError(entity_type)
    existing = db.query(IdempotencyKey).filter(
        IdempotencyKey.idempotency_key == key,
        IdempotencyKey.entity_type == entity_type,
        IdempotencyKey.operator_id == operator_id,
    ).first()
    if existing:
        if existing.expires_at > datetime.utcnow():
            raise DuplicateSubmissionError(key, entity_type, operator_id, existing.entity_id)
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
        raise MissingIdempotencyKeyError(entity_type)
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
