import json
import os
from datetime import datetime, timedelta
from uuid import uuid4
import hashlib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data.json")

def get_password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()

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
                {"content": "客户取片时对颜色很满意", "author": "客服小王", "type": "customer"}
            ],
            "history_extra": [
                {"action": "客户取片", "operator": "客服小王", "description": "客户现场确认取片，对扫描效果满意"}
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
            "history_extra": []
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
                    "resolved": True,
                    "resolution": "已电话联系客户确认，按实际胶卷冲洗，已告知差异",
                    "resolved_by": "客服小王",
                    "resolved_ago": 2
                }
            ],
            "notes": [
                {"content": "客户记错胶卷型号，实际是柯达", "author": "冲印师李四", "type": "internal"}
            ],
            "history_extra": []
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
            "history_extra": []
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
                    "resolved": False,
                    "resolution": None,
                    "resolved_by": None,
                    "resolved_ago": None
                }
            ],
            "notes": [
                {"content": "客户强烈不满，要求尽快重新交付", "author": "客服小王", "type": "urgent"},
                {"content": "正在重新扫描中，优先处理", "author": "冲印师李四", "type": "internal"}
            ],
            "history_extra": [
                {"action": "返工确认", "operator": "店主张三", "description": "返工原因：交付版本错误，返工范围：重新扫描并质检"}
            ],
            "rework_count": 1
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
            "history_extra": []
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
                    "resolved": True,
                    "resolution": "已尝试修复，效果尚可。已向客户说明情况，客户表示理解",
                    "resolved_by": "客服小王",
                    "resolved_ago": 1
                }
            ],
            "notes": [],
            "history_extra": []
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
                {"content": "新客户，后续可以发优惠活动信息", "author": "客服小王", "type": "marketing"}
            ],
            "history_extra": []
        }
    ]
    
    for i, roll in enumerate(demo_rolls):
        registered_at = now - timedelta(days=roll["days_ago"], hours=i % 3)
        estimated = registered_at + timedelta(days=3)
        
        history = []
        reg_time = registered_at.isoformat()
        history.append({
            "timestamp": reg_time,
            "action": "登记",
            "operator": "客服小王",
            "description": f"胶卷登记完成，单号：F{1000 + i:06d}"
        })
        
        if roll["current_step"] >= 1:
            dev_time = (registered_at + timedelta(hours=6)).isoformat()
            history.append({
                "timestamp": dev_time,
                "action": "开始冲洗",
                "operator": "冲印师李四",
                "description": f"胶卷进入冲洗流程，{roll['film_type']} - {roll['development_type']}"
            })
        
        if roll["current_step"] >= 2:
            scan_time = (registered_at + timedelta(days=1, hours=2)).isoformat()
            history.append({
                "timestamp": scan_time,
                "action": "开始扫描",
                "operator": "冲印师李四",
                "description": f"开始扫描，分辨率：{roll['scan_resolution']}"
            })
        
        if roll["current_step"] >= 3:
            qc_time = (registered_at + timedelta(days=2)).isoformat()
            history.append({
                "timestamp": qc_time,
                "action": "质量检查",
                "operator": "冲印师李四",
                "description": "进入质量检查环节"
            })
        
        if roll["current_step"] >= 4:
            complete_time = (registered_at + timedelta(days=2, hours=8)).isoformat()
            history.append({
                "timestamp": complete_time,
                "action": "完成",
                "operator": "冲印师李四",
                "description": "冲扫完成，通知客户取片"
            })
        
        for extra in roll.get("history_extra", []):
            history.append({
                "timestamp": (registered_at + timedelta(days=2, hours=10)).isoformat(),
                **extra
            })
        
        exceptions = []
        for j, exc in enumerate(roll["exceptions"]):
            exc_time = (registered_at + timedelta(days=1 + j)).isoformat()
            exc_record = {
                "id": str(uuid4()),
                "type": exc["type"],
                "description": exc["description"],
                "severity": exc["severity"],
                "reported_by": exc["reported_by"],
                "timestamp": exc_time,
                "resolved": exc["resolved"],
                "resolution": exc["resolution"],
                "resolved_at": None,
                "resolved_by": exc["resolved_by"]
            }
            if exc["resolved"] and exc.get("resolved_ago") is not None:
                exc_record["resolved_at"] = (registered_at + timedelta(days=1 + j + exc["resolved_ago"])).isoformat()
            exceptions.append(exc_record)
        
        notes = []
        for note in roll["notes"]:
            notes.append({
                "id": str(uuid4()),
                "content": note["content"],
                "author": note["author"],
                "timestamp": (registered_at + timedelta(days=2)).isoformat(),
                "type": note["type"]
            })
        
        roll_data = {
            "id": str(uuid4()),
            "registration_number": f"F{1000 + i:06d}",
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
            "registered_at": reg_time,
            "registered_by": "客服小王",
            "current_step": roll["current_step"],
            "estimated_delivery": estimated.isoformat(),
            "actual_delivery": (registered_at + timedelta(days=2, hours=8)).isoformat() if roll["status"] == "completed" else None,
            "amount": roll["amount"],
            "paid": roll["paid"],
            "notes": notes,
            "history": history,
            "exceptions": exceptions,
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
