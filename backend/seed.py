from datetime import datetime, timedelta
from database import SessionLocal
from models import User, Plot, LiftingOrder, LoadingCheck, ExceptionRecord, AuditLog


def seed_data():
    db = SessionLocal()
    if db.query(User).first():
        db.close()
        return

    now = datetime.utcnow()
    base_date = now - timedelta(days=30)

    user1 = User(username="zhangjg", display_name="张建国", role="基地负责人", created_at=base_date)
    user2 = User(username="liyh", display_name="李养护", role="养护员", created_at=base_date)
    user3 = User(username="wanggd", display_name="王跟单", role="销售跟单", created_at=base_date)
    db.add_all([user1, user2, user3])
    db.flush()

    plot1 = Plot(plot_code="A1", location="东区1号地块", seedling_type="香樟", total_count=500, available_count=300, status="在圃", remark="长势良好")
    plot2 = Plot(plot_code="A2", location="东区2号地块", seedling_type="桂花", total_count=400, available_count=100, status="已排单", remark="部分苗木偏小")
    plot3 = Plot(plot_code="B1", location="西区1号地块", seedling_type="红叶石楠", total_count=600, available_count=50, status="已排单", remark="发现根腐病")
    plot4 = Plot(plot_code="B2", location="西区2号地块", seedling_type="银杏", total_count=300, available_count=220, status="在圃", remark="")
    plot5 = Plot(plot_code="C1", location="南区1号地块", seedling_type="紫薇", total_count=350, available_count=160, status="已排单", remark="花期即将到来")
    db.add_all([plot1, plot2, plot3, plot4, plot5])
    db.flush()

    order1 = LiftingOrder(
        order_no="QM20250501001", plot_id=plot1.id, seedling_type="香樟",
        requested_count=100, requester_id=user3.id, assignee_id=user2.id,
        status="已完成", planned_date=base_date + timedelta(days=5),
        completed_at=base_date + timedelta(days=6), remark=""
    )
    order2 = LiftingOrder(
        order_no="QM20250502001", plot_id=plot4.id, seedling_type="银杏",
        requested_count=80, requester_id=user3.id, assignee_id=user2.id,
        status="已完成", planned_date=base_date + timedelta(days=8),
        completed_at=base_date + timedelta(days=9), remark=""
    )
    order3 = LiftingOrder(
        order_no="QM20250510001", plot_id=plot2.id, seedling_type="桂花",
        requested_count=150, requester_id=user3.id, assignee_id=user2.id,
        status="起苗中", planned_date=now - timedelta(days=2), remark=""
    )
    order4 = LiftingOrder(
        order_no="QM20250515001", plot_id=plot5.id, seedling_type="紫薇",
        requested_count=120, requester_id=user3.id, assignee_id=user2.id,
        status="已确认", planned_date=now + timedelta(days=3), remark=""
    )
    order5 = LiftingOrder(
        order_no="QM20250520001", plot_id=plot3.id, seedling_type="红叶石楠",
        requested_count=200, requester_id=user3.id, assignee_id=user2.id,
        status="待确认", planned_date=now + timedelta(days=5), remark=""
    )
    order6 = LiftingOrder(
        order_no="QM20250522001", plot_id=plot1.id, seedling_type="香樟",
        requested_count=100, requester_id=user3.id, assignee_id=user2.id,
        status="异常", planned_date=now - timedelta(days=1), remark="起苗时发现病害"
    )
    db.add_all([order1, order2, order3, order4, order5, order6])
    db.flush()

    loading1 = LoadingCheck(
        order_id=order1.id, checker_id=user1.id, planned_qty=100, actual_qty=100,
        vehicle_no="沪A12345", driver_name="赵师傅", status="已复核",
        loaded_at=base_date + timedelta(days=6), remark=""
    )
    loading2 = LoadingCheck(
        order_id=order2.id, checker_id=user1.id, planned_qty=80, actual_qty=66,
        vehicle_no="沪B67890", driver_name="钱师傅", status="异常",
        loaded_at=base_date + timedelta(days=9), remark="数量有差异"
    )
    loading3 = LoadingCheck(
        order_id=order3.id, checker_id=user1.id, planned_qty=150, actual_qty=None,
        vehicle_no="沪C11111", driver_name="孙师傅", status="待装车",
        loaded_at=None, remark=""
    )
    db.add_all([loading1, loading2, loading3])
    db.flush()

    exc1 = ExceptionRecord(
        source_type="起苗", source_id=order6.id, exception_type="病害",
        severity="紧急", description="A1香樟起苗时发现根腐病感染，部分苗木根系腐烂，需紧急处理",
        handler_id=user1.id, status="处理中",
        resolution="已隔离感染区域，安排药剂处理，将健康苗木移栽",
        created_at=now - timedelta(days=1), handled_at=now - timedelta(hours=12), closed_at=None
    )
    exc2 = ExceptionRecord(
        source_type="装车", source_id=loading2.id, exception_type="数量差异",
        severity="严重", description="装车时计划80棵实际66棵，差14棵，需核实原因",
        handler_id=None, status="待处理", resolution=None,
        created_at=base_date + timedelta(days=9), handled_at=None, closed_at=None
    )
    exc3 = ExceptionRecord(
        source_type="养护", source_id=plot2.id, exception_type="质量问题",
        severity="一般", description="A2桂花部分苗木偏小，未达出圃标准",
        handler_id=user2.id, status="处理中",
        resolution="已标记不合格苗木，安排追加养护，延迟出圃时间",
        created_at=base_date + timedelta(days=15), handled_at=base_date + timedelta(days=16), closed_at=None
    )
    exc4 = ExceptionRecord(
        source_type="装车", source_id=loading1.id, exception_type="客户索赔",
        severity="紧急", description="客户收到香樟100棵后发现3棵死苗，要求赔偿或补发",
        handler_id=user1.id, status="待处理", resolution=None,
        created_at=now - timedelta(days=3), handled_at=None, closed_at=None
    )
    db.add_all([exc1, exc2, exc3, exc4])
    db.flush()

    audit_logs = [
        AuditLog(user_id=user1.id, action="登录", target_type="user", target_id=user1.id, detail="张建国登录系统", created_at=base_date),
        AuditLog(user_id=user3.id, action="登录", target_type="user", target_id=user3.id, detail="王跟单登录系统", created_at=base_date),
        AuditLog(user_id=user3.id, action="创建排单", target_type="lifting_order", target_id=order1.id, detail=f"创建排单 {order1.order_no}，地块 A1，数量 100，地块可用数量剩余 300", created_at=base_date + timedelta(days=1)),
        AuditLog(user_id=user3.id, action="更新地块", target_type="plot", target_id=plot1.id, detail=f"排单占用地块 A1，扣减数量 100，剩余可用 300，状态更新为已排单", created_at=base_date + timedelta(days=1)),
        AuditLog(user_id=user2.id, action="确认排单", target_type="lifting_order", target_id=order1.id, detail=f"确认排单 {order1.order_no}", created_at=base_date + timedelta(days=2)),
        AuditLog(user_id=user2.id, action="开始起苗", target_type="lifting_order", target_id=order1.id, detail=f"开始起苗 {order1.order_no}", created_at=base_date + timedelta(days=3)),
        AuditLog(user_id=user2.id, action="完成起苗", target_type="lifting_order", target_id=order1.id, detail=f"完成起苗 {order1.order_no}，数量 100", created_at=base_date + timedelta(days=6)),
        AuditLog(user_id=user1.id, action="创建装车记录", target_type="loading_check", target_id=loading1.id, detail=f"创建装车复核记录，排单 {order1.order_no}，计划数量 100", created_at=base_date + timedelta(days=6)),
        AuditLog(user_id=user1.id, action="填写实装数量", target_type="loading_check", target_id=loading1.id, detail=f"填写实装数量 100，车牌号 沪A12345，司机 赵师傅，状态更新为装车中", created_at=base_date + timedelta(days=6)),
        AuditLog(user_id=user1.id, action="装车复核通过", target_type="loading_check", target_id=loading1.id, detail="装车复核通过，数量 100", created_at=base_date + timedelta(days=6)),
        AuditLog(user_id=user3.id, action="创建排单", target_type="lifting_order", target_id=order2.id, detail=f"创建排单 {order2.order_no}，地块 B2，数量 80，地块可用数量剩余 220", created_at=base_date + timedelta(days=7)),
        AuditLog(user_id=user3.id, action="更新地块", target_type="plot", target_id=plot4.id, detail=f"排单占用地块 B2，扣减数量 80，剩余可用 220，状态更新为已排单", created_at=base_date + timedelta(days=7)),
        AuditLog(user_id=user2.id, action="确认排单", target_type="lifting_order", target_id=order2.id, detail=f"确认排单 {order2.order_no}", created_at=base_date + timedelta(days=7)),
        AuditLog(user_id=user2.id, action="开始起苗", target_type="lifting_order", target_id=order2.id, detail=f"开始起苗 {order2.order_no}", created_at=base_date + timedelta(days=8)),
        AuditLog(user_id=user2.id, action="完成起苗", target_type="lifting_order", target_id=order2.id, detail=f"完成起苗 {order2.order_no}，数量 80", created_at=base_date + timedelta(days=9)),
        AuditLog(user_id=user1.id, action="创建装车记录", target_type="loading_check", target_id=loading2.id, detail=f"创建装车复核记录，排单 {order2.order_no}，计划数量 80", created_at=base_date + timedelta(days=9)),
        AuditLog(user_id=user1.id, action="填写实装数量", target_type="loading_check", target_id=loading2.id, detail=f"填写实装数量 66，车牌号 沪B67890，司机 钱师傅，状态更新为装车中", created_at=base_date + timedelta(days=9)),
        AuditLog(user_id=user1.id, action="装车复核异常", target_type="loading_check", target_id=loading2.id, detail="装车复核发现数量差异，计划 80，实际 66，已创建异常记录", created_at=base_date + timedelta(days=9)),
        AuditLog(user_id=user3.id, action="创建排单", target_type="lifting_order", target_id=order3.id, detail=f"创建排单 {order3.order_no}，地块 A2，数量 150，地块可用数量剩余 100", created_at=base_date + timedelta(days=10)),
        AuditLog(user_id=user3.id, action="更新地块", target_type="plot", target_id=plot2.id, detail=f"排单占用地块 A2，扣减数量 150，剩余可用 100，状态更新为已排单", created_at=base_date + timedelta(days=10)),
        AuditLog(user_id=user2.id, action="确认排单", target_type="lifting_order", target_id=order3.id, detail=f"确认排单 {order3.order_no}", created_at=base_date + timedelta(days=10)),
        AuditLog(user_id=user2.id, action="开始起苗", target_type="lifting_order", target_id=order3.id, detail=f"开始起苗 {order3.order_no}", created_at=now - timedelta(days=2)),
        AuditLog(user_id=user3.id, action="创建排单", target_type="lifting_order", target_id=order4.id, detail=f"创建排单 {order4.order_no}，地块 C1，数量 120，地块可用数量剩余 160", created_at=base_date + timedelta(days=15)),
        AuditLog(user_id=user3.id, action="更新地块", target_type="plot", target_id=plot5.id, detail=f"排单占用地块 C1，扣减数量 120，剩余可用 160，状态更新为已排单", created_at=base_date + timedelta(days=15)),
        AuditLog(user_id=user2.id, action="确认排单", target_type="lifting_order", target_id=order4.id, detail=f"确认排单 {order4.order_no}", created_at=base_date + timedelta(days=15)),
        AuditLog(user_id=user3.id, action="创建排单", target_type="lifting_order", target_id=order5.id, detail=f"创建排单 {order5.order_no}，地块 B1，数量 200，地块可用数量剩余 50", created_at=now - timedelta(days=5)),
        AuditLog(user_id=user3.id, action="更新地块", target_type="plot", target_id=plot3.id, detail=f"排单占用地块 B1，扣减数量 200，剩余可用 50，状态更新为已排单", created_at=now - timedelta(days=5)),
        AuditLog(user_id=user3.id, action="创建排单", target_type="lifting_order", target_id=order6.id, detail=f"创建排单 {order6.order_no}，地块 A1，数量 100，地块可用数量剩余 200", created_at=now - timedelta(days=1)),
        AuditLog(user_id=user2.id, action="确认排单", target_type="lifting_order", target_id=order6.id, detail=f"确认排单 {order6.order_no}", created_at=now - timedelta(days=1)),
        AuditLog(user_id=user2.id, action="开始起苗", target_type="lifting_order", target_id=order6.id, detail=f"开始起苗 {order6.order_no}", created_at=now - timedelta(hours=20)),
        AuditLog(user_id=user2.id, action="起苗异常", target_type="lifting_order", target_id=order6.id, detail=f"排单 {order6.order_no} 上报异常：病害-紧急，A1香樟起苗时发现根腐病感染", created_at=now - timedelta(days=1)),
        AuditLog(user_id=user2.id, action="创建异常记录", target_type="exception_record", target_id=exc1.id, detail=f"起苗异常记录，排单 {order6.order_no}，类型 病害，严重程度 紧急", created_at=now - timedelta(days=1)),
        AuditLog(user_id=user1.id, action="处理异常", target_type="exception_record", target_id=exc1.id, detail="开始处理异常：病害 - A1香樟起苗时发现根腐病感染", created_at=now - timedelta(hours=12)),
        AuditLog(user_id=user2.id, action="处理异常", target_type="exception_record", target_id=exc3.id, detail="开始处理异常：质量问题 - A2桂花部分苗木偏小", created_at=base_date + timedelta(days=16)),
        AuditLog(user_id=user1.id, action="创建装车记录", target_type="loading_check", target_id=loading3.id, detail=f"创建装车复核记录，排单 {order3.order_no}，计划数量 150", created_at=now - timedelta(days=1)),
    ]
    db.add_all(audit_logs)
    db.commit()
    db.close()
