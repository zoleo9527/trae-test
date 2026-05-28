from datetime import datetime
from typing import Optional


def make_event(timestamp: str, action: str, operator: str, description: str, **extra) -> dict:
    event = {
        "timestamp": timestamp,
        "action": action,
        "operator": operator,
        "description": description,
    }
    event.update(extra)
    return event


def event_register(timestamp: str, operator: str, reg_num: str) -> dict:
    return make_event(timestamp, "登记", operator, f"胶卷登记完成，单号：{reg_num}")


def event_status_update(timestamp: str, operator: str, to_status: str, from_status: Optional[str] = None) -> dict:
    desc = f"状态更新为：{_status_label(to_status)}"
    if from_status:
        desc = f"状态从「{_status_label(from_status)}」更新为「{_status_label(to_status)}」"
    extra = {"to_status": to_status}
    if from_status:
        extra["from_status"] = from_status
    return make_event(timestamp, "状态更新", operator, desc, **extra)


def event_start_develop(timestamp: str, operator: str, film_type: str, dev_type: str) -> dict:
    return make_event(timestamp, "开始冲洗", operator, f"胶卷进入冲洗流程，{film_type} - {dev_type}")


def event_start_scan(timestamp: str, operator: str, resolution: str) -> dict:
    return make_event(timestamp, "开始扫描", operator, f"开始扫描，分辨率：{resolution}")


def event_quality_check(timestamp: str, operator: str) -> dict:
    return make_event(timestamp, "质量检查", operator, "进入质量检查环节")


def event_complete(timestamp: str, operator: str) -> dict:
    return make_event(timestamp, "完成", operator, "冲扫完成，通知客户取片")


def event_exception_report(timestamp: str, operator: str, exc_type: str, severity: str, description: str) -> dict:
    return make_event(timestamp, "异常登记", operator, f"[{severity}] {exc_type}: {description}")


def event_exception_resolve(timestamp: str, operator: str, resolution: str) -> dict:
    return make_event(timestamp, "异常处理", operator, f"异常已处理：{resolution}")


def event_rework(timestamp: str, operator: str, reason: str, scope: str) -> dict:
    scope_label = {"redevelop": "重新冲洗", "rescan": "重新扫描", "full": "全部返工"}.get(scope, scope)
    return make_event(timestamp, "返工确认", operator, f"返工原因：{reason}，返工范围：{scope_label}")


def event_add_note(timestamp: str, operator: str, content: str, note_type: str = "normal") -> dict:
    type_label = {
        "normal": "普通备注",
        "internal": "内部沟通",
        "customer": "客户沟通",
        "urgent": "紧急事项",
        "marketing": "营销备注",
    }.get(note_type, "备注")
    truncated = content[:100] + ("..." if len(content) > 100 else "")
    return make_event(timestamp, f"添加{type_label}", operator, truncated)


def _status_label(status: str) -> str:
    return {
        "registered": "已登记",
        "developing": "冲洗中",
        "scanning": "扫描中",
        "quality_check": "质检中",
        "rework": "返工中",
        "completed": "已完成",
    }.get(status, status)
