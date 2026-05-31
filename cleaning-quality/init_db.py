from __future__ import annotations
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta, date
from app.database import engine, SessionLocal, Base
from app.models import (
    Project, Schedule, Inspection, InspectionItem,
    Rectification, Consumable, ConsumableOrder, Contract, AuditLog,
)

now = datetime.utcnow()
today = date.today()


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Project).first():
        print("数据库已有数据，跳过初始化")
        db.close()
        return

    p1 = Project(
        name="星河广场A座", code="PJ-XH-A001",
        address="高新区星河路88号", contact_name="张经理", contact_phone="13800001111",
        manager_id="mgr_001", manager_name="王建国",
    )
    p2 = Project(
        name="海悦中心B栋", code="PJ-HY-B002",
        address="滨海大道199号", contact_name="李主管", contact_phone="13900002222",
        manager_id="mgr_002", manager_name="刘明",
    )
    p3 = Project(
        name="科创产业园3号楼", code="PJ-KC-C003",
        address="科创路66号", contact_name="赵总", contact_phone="13700003333",
        manager_id="mgr_003", manager_name="陈志远",
    )
    db.add_all([p1, p2, p3])
    db.flush()

    schedules = [
        Schedule(project_id=p1.id, staff_id="s001", staff_name="赵四", work_date=today, shift_type="早班", status="planned"),
        Schedule(project_id=p1.id, staff_id="s002", staff_name="钱五", work_date=today, shift_type="晚班", status="checked_in", check_in_time=now - timedelta(hours=2)),
        Schedule(project_id=p2.id, staff_id="s003", staff_name="孙六", work_date=today, shift_type="全天", status="checked_out", check_in_time=now - timedelta(hours=8), check_out_time=now - timedelta(hours=1)),
        Schedule(project_id=p3.id, staff_id="s004", staff_name="周七", work_date=today, shift_type="早班", status="planned"),
    ]
    db.add_all(schedules)
    db.flush()

    insp1 = Inspection(
        project_id=p1.id, inspector_id="qc_001", inspector_name="质检员-马丽",
        type="routine", status="completed", overall_score=72.5,
        summary="卫生间区域多处不达标，需整改", rectification_required=True,
        scheduled_at=now - timedelta(days=2), completed_at=now - timedelta(days=1),
    )
    insp2 = Inspection(
        project_id=p2.id, inspector_id="qc_002", inspector_name="质检员-郑伟",
        type="spot", status="in_progress",
        scheduled_at=now - timedelta(hours=3),
    )
    insp3 = Inspection(
        project_id=p3.id, inspector_id="qc_001", inspector_name="质检员-马丽",
        type="routine", status="pending",
        scheduled_at=now + timedelta(days=1),
    )
    db.add_all([insp1, insp2, insp3])
    db.flush()

    items1 = [
        InspectionItem(inspection_id=insp1.id, category="卫生间", check_point="地面清洁度", standard="无水渍无污渍", result="fail", score=55, remark="多处水渍"),
        InspectionItem(inspection_id=insp1.id, category="卫生间", check_point="洗手台", standard="无水垢无杂物", result="pass", score=85),
        InspectionItem(inspection_id=insp1.id, category="大堂", check_point="地面光洁度", standard="反光清晰无尘", result="pass", score=90),
        InspectionItem(inspection_id=insp1.id, category="电梯", check_point="轿厢内部", standard="无手印无污渍", result="fail", score=60, remark="按钮区有明显手印"),
    ]
    items2 = [
        InspectionItem(inspection_id=insp2.id, category="办公区", check_point="桌面清洁", standard="无灰尘无杂物", result="pending"),
        InspectionItem(inspection_id=insp2.id, category="走廊", check_point="地面", standard="无垃圾无水渍", result="pending"),
    ]
    db.add_all(items1 + items2)
    db.flush()

    rect1 = Rectification(
        inspection_id=insp1.id, project_id=p1.id,
        issue_description="卫生间地面多处水渍未及时清理，电梯轿厢按钮区有手印",
        category="卫生间", severity="high",
        assignee_id="s001", assignee_name="赵四",
        status="submitted",
        deadline=now - timedelta(hours=6),
        resolution="已重新清洁并安排每小时巡检",
        submitted_at=now - timedelta(hours=3),
    )
    rect2 = Rectification(
        inspection_id=insp1.id, project_id=p1.id,
        issue_description="电梯轿厢按钮区有明显手印",
        category="电梯", severity="medium",
        assignee_id="s002", assignee_name="钱五",
        status="rejected",
        deadline=now - timedelta(hours=12),
        resolution="已擦拭",
        reject_reason="按钮周围仍有油渍，需使用专用清洁剂重新处理",
        submitted_at=now - timedelta(hours=6),
        reviewed_at=now - timedelta(hours=4),
    )
    rect3 = Rectification(
        inspection_id=insp1.id, project_id=p1.id,
        issue_description="大堂玻璃门有指纹",
        category="大堂", severity="low",
        status="pending",
        deadline=now + timedelta(days=2),
    )
    db.add_all([rect1, rect2, rect3])
    db.flush()

    c1 = Consumable(project_id=p1.id, name="84消毒液", unit="桶", current_stock=3, threshold=5, status="low")
    c2 = Consumable(project_id=p1.id, name="垃圾袋(大)", unit="卷", current_stock=20, threshold=10, status="normal")
    c3 = Consumable(project_id=p2.id, name="玻璃清洁剂", unit="瓶", current_stock=1, threshold=3, status="reorder")
    c4 = Consumable(project_id=p3.id, name="洗手液", unit="瓶", current_stock=0, threshold=5, status="critical")
    db.add_all([c1, c2, c3, c4])
    db.flush()

    o1 = ConsumableOrder(
        consumable_id=c3.id, project_id=p2.id, quantity=10,
        requester_id="s003", requester_name="孙六",
        status="pending",
    )
    o2 = ConsumableOrder(
        consumable_id=c1.id, project_id=p1.id, quantity=5,
        requester_id="s001", requester_name="赵四",
        status="approved", approved_by="mgr_001", approved_at=now - timedelta(hours=2),
    )
    db.add_all([o1, o2])
    db.flush()

    contracts = [
        Contract(
            project_id=p1.id, contract_no="CT-2025-001",
            start_date=datetime(2025, 1, 1), end_date=datetime(2025, 12, 31),
            status="active", amount=360000,
            followup_date=now + timedelta(days=15),
        ),
        Contract(
            project_id=p2.id, contract_no="CT-2025-002",
            start_date=datetime(2025, 3, 1), end_date=now + timedelta(days=25),
            status="renewal_pending", amount=240000,
            followup_date=now + timedelta(days=5),
        ),
        Contract(
            project_id=p3.id, contract_no="CT-2024-003",
            start_date=datetime(2024, 6, 1), end_date=datetime(2025, 5, 31),
            status="active", amount=180000,
        ),
    ]
    db.add_all(contracts)

    audit_entries = [
        AuditLog(entity_type="project", entity_id=p1.id, action="create", operator_id="admin", operator_name="管理员", operator_role="admin", new_values='{"name":"星河广场A座"}'),
        AuditLog(entity_type="inspection", entity_id=insp1.id, action="status_change", operator_id="qc_001", operator_name="质检员-马丽", operator_role="inspector", old_values='{"status":"pending"}', new_values='{"status":"completed"}', detail="质检完成，需整改"),
        AuditLog(entity_type="rectification", entity_id=rect2.id, action="review_rejected", operator_id="qc_001", operator_name="质检员-马丽", operator_role="inspector", old_values='{"status":"submitted"}', new_values='{"status":"rejected"}', detail="按钮周围仍有油渍"),
    ]
    db.add_all(audit_entries)

    db.commit()
    db.close()
    print("初始化完成，演示数据已写入")


if __name__ == "__main__":
    seed()
