from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from .database import Base, engine, SessionLocal
from .models import User, Project, Team, ConstructionDiary, QualityInspection, MaterialDelivery, TeamSettlement, ChangeOrder
from .auth import get_password_hash


def init_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    users = [
        User(username="admin", password_hash=get_password_hash("admin123"), role="manager", name="系统管理员"),
        User(username="manager", password_hash=get_password_hash("123456"), role="manager", name="张经理"),
        User(username="inspector", password_hash=get_password_hash("123456"), role="inspector", name="李质检"),
        User(username="leader1", password_hash=get_password_hash("123456"), role="team_leader", name="王班长"),
        User(username="leader2", password_hash=get_password_hash("123456"), role="team_leader", name="赵班长"),
    ]
    db.add_all(users)
    db.flush()

    teams = [
        Team(name="金刚砂地坪一队", leader_name="王班长", leader_phone="13800138001", team_type="floor_construction"),
        Team(name="环氧地坪二队", leader_name="赵班长", leader_phone="13800138002", team_type="epoxy_construction"),
        Team(name="密封固化剂队", leader_name="刘班长", leader_phone="13800138003", team_type="sealant"),
    ]
    db.add_all(teams)
    db.flush()

    projects = [
        Project(
            name="智慧产业园A1栋地坪工程",
            location="深圳市南山区科技园南区",
            total_area=12500.0,
            start_date=datetime(2026, 3, 1),
            expected_end_date=datetime(2026, 6, 30),
            status="in_progress",
            manager_id=users[1].id
        ),
        Project(
            name="生物医药基地生产车间",
            location="广州市黄埔区科学城",
            total_area=8600.0,
            start_date=datetime(2026, 4, 1),
            expected_end_date=datetime(2026, 7, 15),
            status="in_progress",
            manager_id=users[1].id
        ),
        Project(
            name="物流仓储中心地坪工程",
            location="东莞市松山湖",
            total_area=25000.0,
            start_date=datetime(2026, 2, 15),
            expected_end_date=datetime(2026, 5, 30),
            status="in_progress",
            manager_id=users[1].id
        ),
    ]
    db.add_all(projects)
    db.flush()

    base_date = datetime(2026, 5, 20)
    diaries_data = [
        {
            "project_id": projects[0].id, "team_id": teams[0].id,
            "report_date": base_date, "weather": "晴",
            "construction_content": "1-3轴金刚砂耐磨地坪基层处理，2-5轴混凝土地面浇筑",
            "completed_area": 850.0, "worker_count": 12, "work_hours": 10.0,
            "material_used": "C30混凝土45m³，金刚砂耐磨材料6吨",
            "problems": None, "is_exception": False, "status": "approved",
            "created_by": users[3].id
        },
        {
            "project_id": projects[0].id, "team_id": teams[0].id,
            "report_date": base_date + timedelta(days=1), "weather": "多云",
            "construction_content": "4-8轴金刚砂耐磨地坪撒料作业，3-6轴表面收光",
            "completed_area": 720.0, "worker_count": 10, "work_hours": 9.5,
            "material_used": "金刚砂耐磨材料5吨",
            "problems": "上午遇突发阵雨，约200㎡未及时覆盖", "is_exception": True,
            "exception_type": "天气影响", "exception_reason": "突发阵雨导致200㎡地坪表面起砂，需返工处理",
            "exception_handled": False, "status": "exception",
            "created_by": users[3].id
        },
        {
            "project_id": projects[1].id, "team_id": teams[1].id,
            "report_date": base_date, "weather": "晴",
            "construction_content": "洁净车间A区环氧地坪底漆施工",
            "completed_area": 520.0, "worker_count": 8, "work_hours": 8.0,
            "material_used": "环氧底漆400kg",
            "problems": None, "is_exception": False, "status": "approved",
            "created_by": users[4].id
        },
        {
            "project_id": projects[1].id, "team_id": teams[1].id,
            "report_date": base_date + timedelta(days=1), "weather": "晴",
            "construction_content": "洁净车间B区环氧地坪中涂施工",
            "completed_area": 480.0, "worker_count": 8, "work_hours": 8.0,
            "material_used": "环氧中涂600kg，石英砂2吨",
            "problems": "材料批次色差明显", "is_exception": True,
            "exception_type": "材料问题", "exception_reason": "进场材料与样板色号不符，色差较大，已暂停施工等待换货",
            "exception_handled": True, "exception_handler_id": users[1].id,
            "exception_handle_note": "已联系供应商换货，预计明日新货到现场。已施工部分经甲方确认可保留，后续批次需严格调色。",
            "exception_handled_at": base_date + timedelta(days=1, hours=4),
            "status": "exception_handled",
            "created_by": users[4].id
        },
        {
            "project_id": projects[2].id, "team_id": teams[2].id,
            "report_date": base_date - timedelta(days=2), "weather": "晴",
            "construction_content": "1号仓库密封固化剂施工",
            "completed_area": 1800.0, "worker_count": 6, "work_hours": 9.0,
            "material_used": "密封固化剂1200kg",
            "problems": None, "is_exception": False, "status": "approved",
            "created_by": users[3].id
        },
        {
            "project_id": projects[2].id, "team_id": teams[2].id,
            "report_date": base_date - timedelta(days=1), "weather": "晴",
            "construction_content": "2号仓库密封固化剂施工及1号仓库抛光",
            "completed_area": 2200.0, "worker_count": 8, "work_hours": 10.0,
            "material_used": "密封固化剂1500kg",
            "problems": "基层强度不足，部分区域起砂", "is_exception": True,
            "exception_type": "基层问题", "exception_reason": "2号仓库约300㎡区域基层混凝土强度不足，固化处理后仍起砂",
            "exception_handled": False, "status": "exception",
            "created_by": users[3].id
        },
        {
            "project_id": projects[0].id, "team_id": teams[0].id,
            "report_date": base_date + timedelta(days=2), "weather": "晴",
            "construction_content": "9-12轴混凝土地面浇筑，异常区域返工处理",
            "completed_area": 680.0, "worker_count": 14, "work_hours": 11.0,
            "material_used": "C30混凝土38m³，金刚砂耐磨材料5吨",
            "problems": None, "is_exception": False, "status": "submitted",
            "created_by": users[3].id
        },
    ]

    for data in diaries_data:
        diary = ConstructionDiary(**data)
        db.add(diary)
    db.flush()

    inspections_data = [
        {
            "project_id": projects[0].id, "diary_id": 1,
            "inspector_id": users[2].id, "inspection_date": base_date + timedelta(hours=6),
            "inspection_items": "基层处理质量、混凝土浇筑平整度、金刚砂撒料时机",
            "inspection_result": "passed", "issues_found": None,
            "rework_required": False, "status": "completed",
        },
        {
            "project_id": projects[0].id, "diary_id": 2,
            "inspector_id": users[2].id, "inspection_date": base_date + timedelta(days=1, hours=5),
            "inspection_items": "表面质量、平整度、颜色均匀度",
            "inspection_result": "failed", "issues_found": "200㎡区域因雨淋导致表面起砂，强度不足",
            "rework_required": True, "rework_reason": "雨淋导致表面起砂，需铣刨后重新浇筑",
            "rework_area": 200.0, "material_wasted": "金刚砂材料约1.2吨，混凝土约10m³",
            "rectification_deadline": base_date + timedelta(days=4),
            "status": "rework_required",
        },
        {
            "project_id": projects[1].id, "diary_id": 3,
            "inspector_id": users[2].id, "inspection_date": base_date + timedelta(hours=8),
            "inspection_items": "底漆涂布率、附着力、表面干燥情况",
            "inspection_result": "passed", "issues_found": None,
            "rework_required": False, "status": "completed",
        },
        {
            "project_id": projects[1].id, "diary_id": 4,
            "inspector_id": users[2].id, "inspection_date": base_date + timedelta(days=1, hours=6),
            "inspection_items": "中涂施工质量、颜色一致性、平整度",
            "inspection_result": "failed", "issues_found": "材料颜色与样板存在明显色差",
            "rework_required": True, "rework_reason": "材料批次色差，经甲方确认可保留，后续批次需严格调色",
            "rework_area": 0.0, "material_wasted": None,
            "rectification_completed": True,
            "rectification_note": "供应商已确认材料批次问题，已施工部分经甲方确认可保留，不予返工。后续批次需严格按照确认样板调色。",
            "rectification_date": base_date + timedelta(days=2),
            "reinspection_result": "passed",
            "status": "completed",
        },
        {
            "project_id": projects[2].id, "diary_id": 5,
            "inspector_id": users[2].id, "inspection_date": base_date - timedelta(days=2, hours=6),
            "inspection_items": "固化剂涂布率、表面硬度、光泽度",
            "inspection_result": "passed", "issues_found": None,
            "rework_required": False, "status": "completed",
        },
        {
            "project_id": projects[2].id, "diary_id": 6,
            "inspector_id": users[2].id, "inspection_date": base_date - timedelta(days=1, hours=6),
            "inspection_items": "表面硬度、光泽度、平整度",
            "inspection_result": "failed", "issues_found": "约300㎡区域基层强度不足，固化处理后仍起砂",
            "rework_required": True, "rework_reason": "基层混凝土强度不足，需打磨后重新做密封固化处理",
            "rework_area": 300.0, "material_wasted": "密封固化剂约180kg",
            "rectification_deadline": base_date + timedelta(days=2),
            "status": "rework_required",
        },
    ]

    for data in inspections_data:
        inspection = QualityInspection(**data)
        db.add(inspection)

    deliveries_data = [
        {
            "project_id": projects[0].id, "delivery_date": base_date - timedelta(days=1),
            "material_name": "金刚砂耐磨材料", "specification": "灰色 25kg/袋",
            "planned_quantity": 20.0, "actual_quantity": 20.0, "unit": "吨",
            "batch_number": "JS20260518", "supplier": "XX建材有限公司",
            "receiver_id": users[3].id, "status": "received",
        },
        {
            "project_id": projects[1].id, "delivery_date": base_date - timedelta(days=2),
            "material_name": "环氧面漆", "specification": "象牙白 20kg/桶",
            "planned_quantity": 2.0, "actual_quantity": 2.0, "unit": "吨",
            "batch_number": "HY20260515", "supplier": "YY化工科技有限公司",
            "receiver_id": users[4].id,
            "has_quality_issue": True, "quality_issue_note": "实际颜色与样板色号PANTONE 100C不符，色差ΔE=4.2，超出允许范围",
            "return_quantity": 1.5, "status": "partial_return",
        },
        {
            "project_id": projects[2].id, "delivery_date": base_date - timedelta(days=3),
            "material_name": "密封固化剂", "specification": "锂基 25kg/桶",
            "planned_quantity": 5.0, "actual_quantity": 4.8, "unit": "吨",
            "batch_number": "GH20260512", "supplier": "ZZ新材料科技有限公司",
            "receiver_id": users[3].id, "status": "received",
        },
        {
            "project_id": projects[0].id, "delivery_date": base_date + timedelta(days=1),
            "material_name": "C30商品混凝土", "specification": "C30 泵送",
            "planned_quantity": 100.0, "actual_quantity": 98.0, "unit": "m³",
            "batch_number": "20260521C30", "supplier": "AA混凝土有限公司",
            "receiver_id": users[3].id, "status": "received",
        },
        {
            "project_id": projects[1].id, "delivery_date": base_date + timedelta(days=2),
            "material_name": "环氧中涂", "specification": "灰色 25kg/桶",
            "planned_quantity": 3.0, "actual_quantity": 3.0, "unit": "吨",
            "batch_number": "HY20260520", "supplier": "YY化工科技有限公司",
            "receiver_id": users[4].id,
            "has_quality_issue": False, "status": "received",
        },
    ]

    for data in deliveries_data:
        delivery = MaterialDelivery(**data)
        db.add(delivery)

    change_orders = [
        ChangeOrder(
            project_id=projects[0].id,
            change_content="1-3轴区域增加防水层，面积约1500㎡",
            change_reason="甲方要求增加防潮层以满足地下车库使用要求",
            area_change=1500.0, cost_change=120000.0,
            applicant_id=users[1].id, approval_status="approved",
            approver_id=users[0].id, approved_at=datetime(2026, 4, 15),
            approval_note="同意变更，费用按合同单价执行"
        ),
        ChangeOrder(
            project_id=projects[2].id,
            change_content="2号仓库卸货平台区域改为金刚砂耐磨地坪",
            change_reason="使用功能调整，原密封固化剂地面改为重载金刚砂地坪",
            area_change=800.0, cost_change=48000.0,
            applicant_id=users[1].id, approval_status="pending",
        ),
    ]
    db.add_all(change_orders)

    settlements_data = [
        {
            "project_id": projects[0].id, "team_id": teams[0].id,
            "settlement_period": "2026年5月上半月",
            "total_completed_area": 3200.0, "unit_price": 85.0,
            "base_amount": 272000.0, "rework_deduction": 0.0,
            "material_loss_deduction": 0.0, "other_adjustment": 0.0,
            "final_amount": 272000.0, "status": "approved",
            "created_by": users[1].id,
        },
        {
            "project_id": projects[0].id, "team_id": teams[0].id,
            "settlement_period": "2026年5月下半月",
            "total_completed_area": 2250.0, "unit_price": 85.0,
            "base_amount": 191250.0, "rework_deduction": 17000.0,
            "material_loss_deduction": 8500.0, "other_adjustment": 0.0,
            "final_amount": 165750.0,
            "settlement_note": "扣除5月21日雨淋返工面积200㎡人工费17000元，材料浪费扣款8500元",
            "has_dispute": True,
            "dispute_reason": "班组认为返工是不可抗力天气原因造成，不应全额扣款，要求承担50%",
            "dispute_resolved": False, "status": "dispute",
            "created_by": users[1].id,
        },
        {
            "project_id": projects[1].id, "team_id": teams[1].id,
            "settlement_period": "2026年5月上半月",
            "total_completed_area": 1800.0, "unit_price": 120.0,
            "base_amount": 216000.0, "rework_deduction": 0.0,
            "material_loss_deduction": 0.0, "other_adjustment": -5000.0,
            "final_amount": 211000.0,
            "settlement_note": "材料色差问题扣款5000元，双方协商一致",
            "has_dispute": False, "dispute_resolved": True,
            "dispute_resolution": "双方协商各承担50%材料损失，扣款5000元",
            "status": "approved",
            "created_by": users[1].id,
        },
        {
            "project_id": projects[2].id, "team_id": teams[2].id,
            "settlement_period": "2026年5月上半月",
            "total_completed_area": 4000.0, "unit_price": 45.0,
            "base_amount": 180000.0, "rework_deduction": 0.0,
            "material_loss_deduction": 0.0, "other_adjustment": 0.0,
            "final_amount": 180000.0, "status": "pending",
            "created_by": users[1].id,
        },
    ]

    settlement_objs = []
    for data in settlements_data:
        settlement = TeamSettlement(**data)
        db.add(settlement)
        settlement_objs.append(settlement)
    db.flush()

    deduction_details_data = [
        {
            "settlement_id": settlement_objs[1].id,
            "deduction_type": "返工扣款",
            "source_type": "inspection",
            "source_id": 2,
            "description": "5月21日雨淋区域返工，面积200㎡，扣除人工费",
            "amount": 17000.0,
            "area": 200.0
        },
        {
            "settlement_id": settlement_objs[1].id,
            "deduction_type": "材料损耗",
            "source_type": "inspection",
            "source_id": 2,
            "description": "雨淋导致金刚砂材料1.2吨浪费，混凝土10m³报废",
            "amount": 8500.0,
            "area": 0.0
        },
        {
            "settlement_id": settlement_objs[2].id,
            "deduction_type": "材料损耗",
            "source_type": "delivery",
            "source_id": 2,
            "description": "环氧材料批次色差，协商扣款5000元",
            "amount": 5000.0,
            "area": 0.0
        },
    ]

    for data in deduction_details_data:
        from .models import SettlementDeductionDetail
        detail = SettlementDeductionDetail(**data)
        db.add(detail)

    db.commit()
    db.close()
    print("数据库初始化完成，演示数据已导入")


if __name__ == "__main__":
    init_db()
