import json
import os
from datetime import datetime, timedelta
from uuid import uuid4
import hashlib
from events import (
    event_register, event_start_develop, event_start_scan,
    event_quality_check, event_complete, event_exception_report,
    event_exception_resolve, event_rework, event_add_note,
    event_step_advance,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data.json")


def get_password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()


def ts(base: datetime, days: float = 0, hours: float = 0) -> str:
    return (base + timedelta(days=days, hours=hours)).isoformat()


def generate_demo_data():
    now = datetime.now()

    data = {
        "users": {
            "admin": {
                "username": "admin",
                "role": "admin",
                "full_name": "系统管理员",
                "hashed_password": get_password_hash("admin123")
            },
            "owner": {
                "username": "owner",
                "role": "owner",
                "full_name": "店主张三",
                "hashed_password": get_password_hash("owner123")
            },
            "tech": {
                "username": "tech",
                "role": "technician",
                "full_name": "冲印师李四",
                "hashed_password": get_password_hash("tech123")
            },
            "service": {
                "username": "service",
                "role": "service",
                "full_name": "客服小王",
                "hashed_password": get_password_hash("service123")
            }
        },
        "film_rolls": [],
        "next_reg_num": 1015
    }

    demo_rolls = [
        {
            "customer_name": "陈晓明",
            "customer_phone": "13800138001",
            "film_type": "135彩色负片",
            "film_brand": "柯达 Gold 200",
            "iso": 200,
            "frame_count": 36,
            "development_type": "标准C-41",
            "scan_resolution": "4K",
            "special_instructions": "请保留片边",
            "priority": "normal",
            "status": "completed",
            "current_step": 4,
            "amount": 85.0,
            "paid": True,
            "days_ago": 5,
            "tags": [],
            "exceptions": [],
            "notes": [
                {"content": "客户取片时对颜色很满意", "author": "客服小王", "type": "customer", "note_day": 2.4}
            ],
            "rework_count": 0,
            "extra_events": [
                {"action": "客户取片", "operator": "客服小王", "description": "客户现场确认取片，对扫描效果满意", "day": 2.5}
            ]
        },
        {
            "customer_name": "林雅琪",
            "customer_phone": "13900139002",
            "film_type": "120黑白",
            "film_brand": "伊尔福 HP5",
            "iso": 400,
            "frame_count": 12,
            "development_type": "D-76 1:1",
            "scan_resolution": "8K",
            "special_instructions": "迫冲一档，颗粒稍粗没关系",
            "priority": "urgent",
            "status": "quality_check",
            "current_step": 3,
            "amount": 128.0,
            "paid": True,
            "days_ago": 2,
            "tags": ["加急"],
            "exceptions": [],
            "notes": [],
            "rework_count": 0,
            "extra_events": []
        },
        {
            "customer_name": "王建国",
            "customer_phone": "13700137003",
            "film_type": "135彩色负片",
            "film_brand": "富士 C200",
            "iso": 200,
            "frame_count": 36,
            "development_type": "标准C-41",
            "scan_resolution": "4K",
            "special_instructions": "",
            "priority": "normal",
            "status": "scanning",
            "current_step": 2,
            "amount": 75.0,
            "paid": False,
            "days_ago": 3,
            "tags": [],
            "exceptions": [
                {
                    "type": "胶卷混号",
                    "description": "冲洗时发现胶卷暗盒编号与登记不符，疑似客户错装。实际是柯达 ColorPlus 200",
                    "severity": "medium",
                    "reported_by": "冲印师李四",
                    "report_day": 1.2,
                    "resolved": True,
                    "resolution": "已电话联系客户确认，按实际胶卷冲洗，已告知差异",
                    "resolved_by": "客服小王",
                    "resolve_day": 1.6
                }
            ],
            "notes": [
                {"content": "客户记错胶卷型号，实际是柯达", "author": "冲印师李四", "type": "internal", "note_day": 1.3}
            ],
            "rework_count": 0,
            "extra_events": []
        },
        {
            "customer_name": "张雨涵",
            "customer_phone": "13600136004",
            "film_type": "135反转片",
            "film_brand": "富士 Velvia 50",
            "iso": 50,
            "frame_count": 36,
            "development_type": "E-6",
            "scan_resolution": "8K",
            "special_instructions": "请严格按标准时间，不要调整反差",
            "priority": "high",
            "status": "developing",
            "current_step": 1,
            "amount": 168.0,
            "paid": True,
            "days_ago": 1,
            "tags": ["高端客户"],
            "exceptions": [],
            "notes": [],
            "rework_count": 0,
            "extra_events": []
        },
        {
            "customer_name": "刘志远",
            "customer_phone": "13500135005",
            "film_type": "135彩色负片",
            "film_brand": "柯达 Portra 400",
            "iso": 400,
            "frame_count": 36,
            "development_type": "标准C-41",
            "scan_resolution": "4K",
            "special_instructions": "肤色尽量自然",
            "priority": "normal",
            "status": "rework",
            "current_step": 1,
            "amount": 98.0,
            "paid": True,
            "days_ago": 4,
            "tags": ["返工", "异常"],
            "exceptions": [
                {
                    "type": "交付版本错发",
                    "description": "第一次交付的是低清压缩版，客户要求原始4K文件。客户是专业摄影师需要修图",
                    "severity": "high",
                    "reported_by": "客服小王",
                    "report_day": 2.3,
                    "resolved": False,
                    "resolution": None,
                    "resolved_by": None,
                    "resolve_day": None
                }
            ],
            "notes": [
                {"content": "客户强烈不满，要求尽快重新交付", "author": "客服小王", "type": "urgent", "note_day": 2.4},
                {"content": "正在重新扫描中，优先处理", "author": "冲印师李四", "type": "internal", "note_day": 2.8}
            ],
            "rework_count": 1,
            "extra_events": [],
            "rework": {
                "reason": "交付版本错误",
                "scope": "rescan",
                "confirmed_by": "店主张三",
                "rework_day": 2.6
            }
        },
        {
            "customer_name": "周婷婷",
            "customer_phone": "13400134006",
            "film_type": "135黑白",
            "film_brand": "柯达 T-Max 100",
            "iso": 100,
            "frame_count": 36,
            "development_type": "D-76 原液",
            "scan_resolution": "4K",
            "special_instructions": "",
            "priority": "normal",
            "status": "registered",
            "current_step": 0,
            "amount": 88.0,
            "paid": True,
            "days_ago": 0,
            "tags": [],
            "exceptions": [],
            "notes": [],
            "rework_count": 0,
            "extra_events": []
        },
        {
            "customer_name": "吴志强",
            "customer_phone": "13300133007",
            "film_type": "120彩色负片",
            "film_brand": "富士 Pro 400H",
            "iso": 400,
            "frame_count": 16,
            "development_type": "标准C-41",
            "scan_resolution": "8K",
            "special_instructions": "婚礼照片，请格外小心",
            "priority": "urgent",
            "status": "scanning",
            "current_step": 2,
            "amount": 198.0,
            "paid": True,
            "days_ago": 2,
            "tags": ["加急", "婚礼"],
            "exceptions": [
                {
                    "type": "片基划伤",
                    "description": "第8-10帧发现轻微划伤，可能是相机内部造成的",
                    "severity": "low",
                    "reported_by": "冲印师李四",
                    "report_day": 1.1,
                    "resolved": True,
                    "resolution": "已尝试修复，效果尚可。已向客户说明情况，客户表示理解",
                    "resolved_by": "客服小王",
                    "resolve_day": 1.5
                }
            ],
            "notes": [],
            "rework_count": 0,
            "extra_events": []
        },
        {
            "customer_name": "郑美玲",
            "customer_phone": "13200132008",
            "film_type": "135彩色负片",
            "film_brand": "柯达 UltraMax 400",
            "iso": 400,
            "frame_count": 24,
            "development_type": "标准C-41",
            "scan_resolution": "2K",
            "special_instructions": "第一次拍胶片，谢谢！",
            "priority": "normal",
            "status": "completed",
            "current_step": 4,
            "amount": 58.0,
            "paid": True,
            "days_ago": 6,
            "tags": ["新客户"],
            "exceptions": [],
            "notes": [
                {"content": "新客户，后续可以发优惠活动信息", "author": "客服小王", "type": "marketing", "note_day": 2.5}
            ],
            "rework_count": 0,
            "extra_events": []
        }
    ]

    for i, roll in enumerate(demo_rolls):
        registered_at = now - timedelta(days=roll["days_ago"], hours=i % 3)
        estimated = registered_at + timedelta(days=3)
        reg_num = f"F{1000 + i:06d}"

        history = []
        exceptions_records = []
        notes_records = []

        history.append(event_register(ts(registered_at), "客服小王", reg_num))

        if roll["current_step"] >= 1:
            history.append(event_step_advance(
                ts(registered_at, hours=6), "冲印师李四",
                "registered", "developing", 1,
                film_type=roll["film_type"], dev_type=roll["development_type"],
            ))

        for j, exc in enumerate(roll["exceptions"]):
            exc_report_time = ts(registered_at, days=exc["report_day"])
            exc_record = {
                "id": str(uuid4()),
                "type": exc["type"],
                "description": exc["description"],
                "severity": exc["severity"],
                "reported_by": exc["reported_by"],
                "timestamp": exc_report_time,
                "resolved": exc["resolved"],
                "resolution": exc["resolution"],
                "resolved_at": None,
                "resolved_by": exc.get("resolved_by")
            }
            history.append(event_exception_report(exc_report_time, exc["reported_by"], exc["type"], exc["severity"], exc["description"]))

            if exc["resolved"] and exc.get("resolve_day") is not None:
                exc_resolve_time = ts(registered_at, days=exc["resolve_day"])
                exc_record["resolved_at"] = exc_resolve_time
                history.append(event_exception_resolve(exc_resolve_time, exc["resolved_by"], exc["resolution"]))

            exceptions_records.append(exc_record)

        if roll["current_step"] >= 2:
            history.append(event_step_advance(
                ts(registered_at, days=1, hours=2), "冲印师李四",
                "developing", "scanning", 2,
                resolution=roll["scan_resolution"],
            ))

        if roll["current_step"] >= 3:
            history.append(event_step_advance(
                ts(registered_at, days=2), "冲印师李四",
                "scanning", "quality_check", 3,
            ))

        if roll["current_step"] >= 4:
            history.append(event_step_advance(
                ts(registered_at, days=2, hours=8), "冲印师李四",
                "quality_check", "completed", 4,
            ))

        if "rework" in roll:
            rw = roll["rework"]
            rw_time = ts(registered_at, days=rw["rework_day"])
            history.append(event_rework(rw_time, rw["confirmed_by"], rw["reason"], rw["scope"]))

        for note in roll["notes"]:
            note_time = ts(registered_at, days=note["note_day"])
            notes_records.append({
                "id": str(uuid4()),
                "content": note["content"],
                "author": note["author"],
                "timestamp": note_time,
                "type": note["type"]
            })
            history.append(event_add_note(note_time, note["author"], note["content"], note["type"]))

        for extra in roll.get("extra_events", []):
            history.append({
                "timestamp": ts(registered_at, days=extra["day"]),
                "action": extra["action"],
                "operator": extra["operator"],
                "description": extra["description"]
            })

        history.sort(key=lambda e: e["timestamp"])

        roll_data = {
            "id": str(uuid4()),
            "registration_number": reg_num,
            "customer_name": roll["customer_name"],
            "customer_phone": roll["customer_phone"],
            "film_type": roll["film_type"],
            "film_brand": roll["film_brand"],
            "iso": roll["iso"],
            "frame_count": roll["frame_count"],
            "development_type": roll["development_type"],
            "scan_resolution": roll["scan_resolution"],
            "special_instructions": roll["special_instructions"],
            "status": roll["status"],
            "priority": roll["priority"],
            "registered_at": ts(registered_at),
            "registered_by": "客服小王",
            "current_step": roll["current_step"],
            "estimated_delivery": estimated.isoformat(),
            "actual_delivery": ts(registered_at, days=2, hours=8) if roll["status"] == "completed" else None,
            "amount": roll["amount"],
            "paid": roll["paid"],
            "notes": notes_records,
            "history": history,
            "exceptions": exceptions_records,
            "rework_count": roll.get("rework_count", 0),
            "tags": roll["tags"]
        }
        data["film_rolls"].append(roll_data)

    return data


if __name__ == "__main__":
    data = generate_demo_data()
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"演示数据已生成！文件路径: {DATA_FILE}")
