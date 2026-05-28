#!/usr/bin/env python3
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app import models
from app.auth import get_password_hash


def init_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if not db.query(models.User).first():
            print("Creating initial users...")

            users = [
                models.User(
                    username="admin",
                    email="admin@shipagent.com",
                    full_name="系统管理员",
                    role=models.UserRole.ADMIN,
                    hashed_password=get_password_hash("admin123"),
                    is_active=True
                ),
                models.User(
                    username="manager",
                    email="manager@shipagent.com",
                    full_name="代理经理-张明",
                    role=models.UserRole.AGENT_MANAGER,
                    hashed_password=get_password_hash("test123"),
                    is_active=True
                ),
                models.User(
                    username="site",
                    email="site@shipagent.com",
                    full_name="现场协调-李强",
                    role=models.UserRole.SITE_COORDINATOR,
                    hashed_password=get_password_hash("test123"),
                    is_active=True
                ),
                models.User(
                    username="document",
                    email="document@shipagent.com",
                    full_name="单证专员-王芳",
                    role=models.UserRole.DOCUMENT_SPECIALIST,
                    hashed_password=get_password_hash("test123"),
                    is_active=True
                ),
                models.User(
                    username="finance",
                    email="finance@shipagent.com",
                    full_name="财务-赵静",
                    role=models.UserRole.FINANCE,
                    hashed_password=get_password_hash("test123"),
                    is_active=True
                ),
            ]

            db.add_all(users)
            db.commit()

            for u in users:
                db.refresh(u)

            print("Creating sample berth plans...")

            berth1 = models.BerthPlan(
                vessel_name="中远之星",
                vessel_imo="9876543",
                voyage_number="VY2024-001",
                port="上海港",
                berth_number="B-12",
                eta=datetime.now() + timedelta(days=3),
                etb=datetime.now() + timedelta(days=3, hours=6),
                etd=datetime.now() + timedelta(days=5),
                status=models.TaskStatus.PENDING,
                remarks="首次靠泊，需准备引水",
                created_by=users[1].id
            )

            berth2 = models.BerthPlan(
                vessel_name="海之韵",
                vessel_imo="8765432",
                voyage_number="VY2024-002",
                port="宁波港",
                berth_number="N-08",
                eta=datetime.now() + timedelta(days=5),
                etb=datetime.now() + timedelta(days=5, hours=4),
                etd=datetime.now() + timedelta(days=7),
                status=models.TaskStatus.IN_PROGRESS,
                remarks="有船员换班需求",
                created_by=users[1].id
            )

            berth3 = models.BerthPlan(
                vessel_name="东方明珠",
                vessel_imo="7654321",
                voyage_number="VY2024-003",
                port="深圳港",
                berth_number="S-15",
                eta=datetime.now() - timedelta(days=2),
                etb=datetime.now() - timedelta(days=2, hours=8),
                etd=datetime.now() + timedelta(days=1),
                status=models.TaskStatus.NEEDS_REVIEW,
                remarks="待确认费用",
                created_by=users[2].id
            )

            berth4 = models.BerthPlan(
                vessel_name="珠江号",
                vessel_imo="6543210",
                voyage_number="VY2024-004",
                port="广州港",
                berth_number="G-05",
                eta=datetime.now() + timedelta(days=7),
                etb=datetime.now() + timedelta(days=7, hours=10),
                etd=datetime.now() + timedelta(days=10),
                status=models.TaskStatus.REJECTED,
                remarks="靠泊时间冲突，需重新安排",
                created_by=users[1].id
            )

            db.add_all([berth1, berth2, berth3, berth4])
            db.commit()

            for b in [berth1, berth2, berth3, berth4]:
                db.refresh(b)

            print("Creating sample crew changes...")

            crew1 = models.CrewChange(
                berth_plan_id=berth1.id,
                change_type=models.CrewChangeType.SIGN_ON,
                crew_name="张伟",
                crew_rank="船长",
                nationality="中国",
                document_type=models.DocumentType.PASSPORT,
                document_number="E12345678",
                document_expiry=datetime.now() + timedelta(days=365),
                flight_details="MU5101 北京-上海",
                pickup_location="浦东机场T2",
                hotel_required=True,
                status=models.TaskStatus.PENDING,
                remarks="需要接机服务",
                created_by=users[2].id
            )

            crew2 = models.CrewChange(
                berth_plan_id=berth1.id,
                change_type=models.CrewChangeType.SIGN_OFF,
                crew_name="陈刚",
                crew_rank="大副",
                nationality="中国",
                document_type=models.DocumentType.PASSPORT,
                document_number="E87654321",
                document_expiry=datetime.now() + timedelta(days=180),
                flight_details="CA1832 上海-北京",
                pickup_location="码头门口",
                hotel_required=False,
                status=models.TaskStatus.IN_PROGRESS,
                remarks="证件已确认",
                created_by=users[2].id
            )

            crew3 = models.CrewChange(
                berth_plan_id=berth2.id,
                change_type=models.CrewChangeType.SIGN_ON,
                crew_name="刘洋",
                crew_rank="轮机长",
                nationality="中国",
                document_type=models.DocumentType.SEAMAN_BOOK,
                document_number="A987654",
                document_expiry=datetime.now() + timedelta(days=90),
                flight_details="HO1234 深圳-宁波",
                pickup_location="栎社机场",
                hotel_required=True,
                status=models.TaskStatus.NEEDS_REVIEW,
                remarks="证件即将到期，需提醒",
                created_by=users[3].id
            )

            db.add_all([crew1, crew2, crew3])
            db.commit()

            for c in [crew1, crew2, crew3]:
                db.refresh(c)

            print("Creating sample checkpoints...")

            checkpoints = [
                models.CheckpointReminder(
                    berth_plan_id=berth1.id,
                    crew_change_id=crew1.id,
                    title="张伟-护照签证审核",
                    description="审核船员护照和签证有效期",
                    checkpoint_type="document",
                    due_date=datetime.now() + timedelta(days=1),
                    status=models.TaskStatus.PENDING,
                    priority=1,
                    assigned_to=users[3].id
                ),
                models.CheckpointReminder(
                    berth_plan_id=berth1.id,
                    title="中远之星-引水申请",
                    description="申请港口引水服务",
                    checkpoint_type="port_service",
                    due_date=datetime.now() + timedelta(days=2),
                    status=models.TaskStatus.PENDING,
                    priority=2,
                    assigned_to=users[2].id
                ),
                models.CheckpointReminder(
                    berth_plan_id=berth1.id,
                    crew_change_id=crew1.id,
                    title="张伟-酒店预订",
                    description="预订船员入境酒店",
                    checkpoint_type="hotel",
                    due_date=datetime.now() + timedelta(hours=12),
                    status=models.TaskStatus.IN_PROGRESS,
                    priority=1,
                    assigned_to=users[2].id
                ),
                models.CheckpointReminder(
                    berth_plan_id=berth2.id,
                    crew_change_id=crew3.id,
                    title="刘洋-证件续期提醒",
                    description="海员证即将到期，需要通知船员续期",
                    checkpoint_type="document",
                    due_date=datetime.now() - timedelta(days=1),
                    status=models.TaskStatus.REJECTED,
                    priority=1,
                    assigned_to=users[3].id,
                    rejection_reason="船员已确认续期中，等待新证件"
                ),
                models.CheckpointReminder(
                    berth_plan_id=berth3.id,
                    title="东方明珠-费用确认",
                    description="确认所有费用并提交结算",
                    checkpoint_type="finance",
                    due_date=datetime.now() + timedelta(days=1),
                    status=models.TaskStatus.NEEDS_REVIEW,
                    priority=1,
                    assigned_to=users[4].id
                ),
            ]

            db.add_all(checkpoints)
            db.commit()

            print("Creating sample payments...")

            payments = [
                models.AdvancePayment(
                    berth_plan_id=berth1.id,
                    reference_number="PAY-2024-001",
                    vendor_name="上海港口服务公司",
                    description="引水服务费",
                    amount=5000.00,
                    currency="CNY",
                    payment_date=datetime.now(),
                    payment_status=models.PaymentStatus.UNPAID,
                    reimbursement_status=models.PaymentStatus.UNPAID,
                    invoice_number=None,
                    remarks="待开票",
                    created_by=users[4].id
                ),
                models.AdvancePayment(
                    berth_plan_id=berth1.id,
                    reference_number="PAY-2024-002",
                    vendor_name="锦江之星酒店",
                    description="船员住宿费用",
                    amount=1200.00,
                    currency="CNY",
                    payment_date=datetime.now() - timedelta(days=2),
                    payment_status=models.PaymentStatus.PENDING_REIMBURSEMENT,
                    reimbursement_status=models.PaymentStatus.PENDING_REIMBURSEMENT,
                    invoice_number="INV-2024-0001",
                    remarks="已提交发票，等待报销",
                    created_by=users[4].id
                ),
                models.AdvancePayment(
                    berth_plan_id=berth2.id,
                    reference_number="PAY-2024-003",
                    vendor_name="宁波外代",
                    description="港口代理费",
                    amount=8500.00,
                    currency="CNY",
                    payment_date=datetime.now() - timedelta(days=5),
                    payment_status=models.PaymentStatus.REIMBURSED,
                    reimbursement_status=models.PaymentStatus.REIMBURSED,
                    reimbursement_date=datetime.now() - timedelta(days=1),
                    invoice_number="INV-2024-0002",
                    remarks="已结清",
                    created_by=users[4].id
                ),
                models.AdvancePayment(
                    berth_plan_id=berth3.id,
                    reference_number="PAY-2024-004",
                    vendor_name="深圳运输公司",
                    description="船员接送车费",
                    amount=800.00,
                    currency="CNY",
                    payment_date=datetime.now() - timedelta(days=10),
                    payment_status=models.PaymentStatus.PENDING_REIMBURSEMENT,
                    reimbursement_status=models.PaymentStatus.OVERDUE,
                    invoice_number="INV-2024-0003",
                    remarks="报销超时，需要跟进",
                    created_by=users[4].id
                ),
            ]

            db.add_all(payments)
            db.commit()

            print("Creating sample communications...")

            comms = [
                models.Communication(
                    berth_plan_id=berth1.id,
                    crew_change_id=crew1.id,
                    communication_type="email",
                    subject="船员张伟-签证确认",
                    content="您好，已收到船员张伟的签证扫描件，有效期至2025年5月。请确认是否可以安排入境。",
                    sender="document@shipagent.com",
                    recipient="immigration@port.com",
                    reference="EMAIL-2024-001"
                ),
                models.Communication(
                    berth_plan_id=berth1.id,
                    payment_id=payments[0].id,
                    communication_type="email",
                    subject="付款申请-PAY-2024-001",
                    content="请安排支付引水服务费用5000元。详情见附件。",
                    sender="finance@shipagent.com",
                    recipient="ap@company.com",
                    reference="EMAIL-2024-002"
                ),
                models.Communication(
                    berth_plan_id=berth2.id,
                    crew_change_id=crew3.id,
                    communication_type="email",
                    subject="刘洋-证件续期提醒",
                    content="您好，您的海员证将在3个月后到期，请及时办理续期手续。如有问题请联系单证部。",
                    sender="document@shipagent.com",
                    recipient="liuyang@ship.com",
                    reference="EMAIL-2024-003"
                ),
                models.Communication(
                    berth_plan_id=berth3.id,
                    payment_id=payments[3].id,
                    communication_type="phone",
                    subject="报销跟进-PAY-2024-004",
                    content="电话联系财务询问PAY-2024-004报销进度，对方表示需要补充发票明细。",
                    sender="site@shipagent.com",
                    recipient="finance@shipagent.com"
                ),
            ]

            db.add_all(comms)
            db.commit()

            print("\n" + "="*60)
            print("数据库初始化完成！")
            print("="*60)
            print("\n默认用户账号：")
            print("  管理员:    admin / admin123")
            print("  代理经理:  manager / test123")
            print("  现场协调:  site / test123")
            print("  单证专员:  document / test123")
            print("  财务:      finance / test123")
            print("\nAPI文档地址: http://localhost:8000/docs")
            print("="*60)

    except Exception as e:
        db.rollback()
        print(f"初始化失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
