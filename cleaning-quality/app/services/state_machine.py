from typing import Optional
from datetime import datetime
from app.config import INSPECTION_STATUSES, RECTIFICATION_STATUSES


class StateTransitionError(Exception):
    def __init__(self, entity: str, from_state: str, to_state: str, reason: str = ""):
        self.entity = entity
        self.from_state = from_state
        self.to_state = to_state
        self.reason = reason
        super().__init__(
            f"[{entity}] 不允许的状态流转: {from_state} -> {to_state}"
            + (f" ({reason})" if reason else "")
        )


class ConcurrentTransitionError(Exception):
    def __init__(self, entity: str, entity_id: int, detail: str = ""):
        self.entity = entity
        self.entity_id = entity_id
        super().__init__(
            f"[{entity}] id={entity_id} 存在并发状态冲突"
            + (f": {detail}" if detail else "")
        )


INSPECTION_TRANSITIONS = {
    "pending": {"in_progress"},
    "in_progress": {"completed", "skipped"},
    "completed": set(),
    "skipped": set(),
}

RECTIFICATION_TRANSITIONS = {
    "pending": {"assigned"},
    "assigned": {"in_progress"},
    "in_progress": {"submitted"},
    "submitted": {"approved", "rejected"},
    "rejected": {"in_progress"},
    "approved": set(),
    "overdue": {"in_progress", "assigned"},
}

CONSUMABLE_STATUS_TRANSITIONS = {
    "normal": {"low"},
    "low": {"reorder", "normal", "critical"},
    "reorder": {"normal", "low"},
    "critical": {"reorder", "low"},
}

CONTRACT_STATUS_TRANSITIONS = {
    "active": {"renewal_pending", "expired", "terminated"},
    "renewal_pending": {"renewing", "expired", "terminated"},
    "renewing": {"active", "terminated"},
    "expired": {"terminated"},
    "terminated": set(),
}


def validate_inspection_transition(current: str, target: str) -> None:
    if current not in INSPECTION_STATUSES:
        raise StateTransitionError("Inspection", current, target, f"当前状态 {current} 不合法")
    if target not in INSPECTION_TRANSITIONS.get(current, set()):
        raise StateTransitionError("Inspection", current, target)


def validate_rectification_transition(current: str, target: str) -> None:
    if current not in RECTIFICATION_STATUSES:
        raise StateTransitionError("Rectification", current, target, f"当前状态 {current} 不合法")
    if target not in RECTIFICATION_TRANSITIONS.get(current, set()):
        raise StateTransitionError("Rectification", current, target)


def validate_consumable_transition(current: str, target: str) -> None:
    if target not in CONSUMABLE_STATUS_TRANSITIONS.get(current, set()):
        raise StateTransitionError("Consumable", current, target)


def validate_contract_transition(current: str, target: str) -> None:
    if target not in CONTRACT_STATUS_TRANSITIONS.get(current, set()):
        raise StateTransitionError("Contract", current, target)


def check_rectification_overdue(rectification, now: Optional[datetime] = None) -> bool:
    if rectification.status in ("pending", "assigned", "in_progress") and rectification.deadline:
        check_time = now or datetime.utcnow()
        if check_time > rectification.deadline:
            return True
    return False


def auto_transition_consumable_status(current_stock: float, threshold: float) -> str:
    ratio = current_stock / threshold if threshold > 0 else 999
    if ratio <= 0:
        return "critical"
    elif ratio < 0.5:
        return "reorder"
    elif ratio < 1.0:
        return "low"
    else:
        return "normal"


def check_optimistic_lock(entity, expected_version: Optional[int] = None) -> None:
    if expected_version is None:
        return
    if not hasattr(entity, 'version'):
        return
    if entity.version != expected_version:
        raise ConcurrentTransitionError(
            entity.__class__.__name__,
            entity.id,
            f"版本冲突: 预期版本 {expected_version}，当前版本 {entity.version}，该记录可能已被其他操作修改，请刷新后重试"
        )


def increment_version(entity) -> None:
    if hasattr(entity, 'version'):
        entity.version += 1
