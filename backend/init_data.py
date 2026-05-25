from datetime import datetime, timedelta
from app.database import SessionLocal, engine
from app import models, schemas, crud

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    print("开始初始化数据...")

    volunteers = [
        {"name": "张三", "email": "zhangsan@museum.com", "phone": "13800138001", "role": "volunteer"},
        {"name": "李四", "email": "lisi@museum.com", "phone": "13800138002", "role": "volunteer"},
        {"name": "王五", "email": "wangwu@museum.com", "phone": "13800138003", "role": "volunteer"},
        {"name": "赵六", "email": "zhaoliu@museum.com", "phone": "13800138004", "role": "volunteer"},
    ]

    created_volunteers = []
    for v in volunteers:
        user = crud.create_user(db, schemas.UserCreate(**v))
        created_volunteers.append(user)
        print(f"创建志愿者: {user.name}")

    manager = crud.create_user(db, schemas.UserCreate(
        name="管理员",
        email="admin@museum.com",
        phone="13900139000",
        role="manager"
    ))
    print(f"创建管理员: {manager.name}")

    locations = ["主展厅A区", "主展厅B区", "特展厅", "入口接待处", "纪念品商店"]
    tasks = ["导览讲解", "秩序维护", "票务协助", "展品看护", "观众咨询"]

    today = datetime.now()
    for i, volunteer in enumerate(created_volunteers):
        for j in range(3):
            schedule_date = today + timedelta(days=j)
            crud.create_schedule(db, schemas.VolunteerScheduleCreate(
                volunteer_id=volunteer.id,
                date=schedule_date,
                shift_start=schedule_date.replace(hour=9, minute=0),
                shift_end=schedule_date.replace(hour=12, minute=0),
                location=locations[i % len(locations)],
                task_description=tasks[j % len(tasks)]
            ))
    print("创建志愿者排班完成")

    exhibits = [
        {"name": "星空下的思考者", "code": "ART-001", "artist": "林风眠", "year": "1952", "status": "on_display", "location": "主展厅A区"},
        {"name": "山水长卷", "code": "ART-002", "artist": "张大千", "year": "1948", "status": "on_display", "location": "主展厅B区"},
        {"name": "骏马图", "code": "ART-003", "artist": "徐悲鸿", "year": "1939", "status": "in_storage", "location": "藏品库"},
        {"name": "墨竹", "code": "ART-004", "artist": "郑板桥", "year": "1756", "status": "in_transit", "location": "运输中"},
        {"name": "青花瓷瓶", "code": "CRA-001", "artist": "佚名", "year": "清康熙", "status": "on_display", "location": "特展厅"},
    ]

    created_exhibits = []
    for e in exhibits:
        exhibit = crud.create_exhibit(db, schemas.ExhibitCreate(**e))
        created_exhibits.append(exhibit)
        print(f"创建展品: {exhibit.name}")

    crud.create_exhibit_transfer(db, schemas.ExhibitTransferCreate(
        exhibit_id=created_exhibits[3].id,
        from_location="藏品库",
        to_location="主展厅A区",
        transfer_type="布展",
        handler_name="张馆长",
        notes="春季特展布展"
    ))
    print("创建展品流转记录完成")

    activities = [
        {"name": "春日艺术导览", "description": "专业讲解员带领参观春季特展", "max_participants": 30},
        {"name": "亲子手工坊", "description": "周末亲子艺术体验活动", "max_participants": 20},
        {"name": "艺术家讲座", "description": "特邀当代艺术家分享创作心得", "max_participants": 50},
    ]

    created_activities = []
    for i, a in enumerate(activities):
        activity_date = today + timedelta(days=i + 1)
        activity = crud.create_activity(db, schemas.ActivityCreate(
            **a,
            start_time=activity_date.replace(hour=10, minute=0),
            end_time=activity_date.replace(hour=12, minute=0),
            location="多功能厅"
        ))
        created_activities.append(activity)
        print(f"创建活动: {activity.name}")

    for activity in created_activities:
        for i in range(5):
            crud.create_ticket(db, schemas.TicketCreate(
                activity_id=activity.id,
                ticket_code=f"TKT{activity.id}-{i+1:03d}",
                visitor_name=f"观众{i+1}",
                visitor_phone=f"1380000{1000 + activity.id * 10 + i}"
            ))
    print("创建门票完成")

    feedback_types = ["complaint", "suggestion", "praise", "question"]
    feedback_titles = [
        "展厅温度过低",
        "建议增加休息座椅",
        "导览服务非常专业",
        "请问特展持续到什么时候？",
        "建议增加多语言讲解",
        "纪念品商店排队太长"
    ]
    feedback_contents = [
        "今天参观时主展厅温度明显偏低，老人和小孩感觉很冷，建议适当调高温度。",
        "参观路线中休息区域较少，走完全程比较累，建议在各展厅之间增加一些座椅。",
        "今天的讲解员非常专业，对每幅作品的背景故事都讲解得很清楚，收获很大！",
        "对春季特展很感兴趣，想知道这个展览具体到什么时候结束？",
        "外国游客也不少，建议增加英文讲解设备或多语种标识。",
        "周末纪念品商店排队时间太长，建议增加收银台或实行预约购买。"
    ]

    feedback_status_config = [
        {"status": "pending", "needs_review": False, "has_schedule": True},
        {"status": "pending", "needs_review": False, "has_schedule": True},
        {"status": "pending", "needs_review": False, "has_schedule": False},
        {"status": "resolved", "needs_review": False, "has_schedule": False},
        {"status": "rejected", "needs_review": False, "has_schedule": True},
        {"status": "processing", "needs_review": True, "has_schedule": False},
    ]

    created_feedbacks = []
    for i in range(6):
        config = feedback_status_config[i]
        feedback = crud.create_feedback(db, schemas.FeedbackCreate(
            feedback_type=feedback_types[i % len(feedback_types)],
            title=feedback_titles[i],
            content=feedback_contents[i],
            visitor_name=f"游客{100 + i}",
            visitor_contact=f"139{1000000 + i}",
            schedule_id=1 if config["has_schedule"] else None
        ))
        created_feedbacks.append(feedback)
        
        if config["status"] in ["resolved", "rejected", "processing"]:
            response_text = "感谢您的反馈，我们会尽快改进。" if config["status"] == "resolved" else "抱歉，您的反馈暂时无法处理，如有疑问请联系客服。" if config["status"] == "rejected" else "您的反馈正在处理中，请耐心等待。"
            crud.update_feedback(db, feedback.id, schemas.FeedbackUpdate(
                status=config["status"],
                handler_id=manager.id,
                response=response_text
            ))
        
        if config["needs_review"]:
            crud.update_feedback(db, feedback.id, schemas.FeedbackUpdate(
                needs_review=True,
                review_notes="需要物业部门协同处理展厅温度问题，请尽快落实"
            ))
            crud.create_review_trace(db, schemas.ReviewTraceCreate(
                feedback_id=feedback.id,
                operator_name=manager.name,
                action="发起回查",
                remarks="第一次回查：已联系物业部门，预计3个工作日内解决"
            ))
        
        status_label = {"pending": "待处理", "processing": "处理中", "resolved": "已解决", "rejected": "已驳回"}[config["status"]]
        review_label = " [需回查]" if config["needs_review"] else ""
        print(f"创建反馈: {feedback.title} - {status_label}{review_label}")

    print("\n数据初始化完成！")
    print(f"志愿者: {len(created_volunteers)} 名")
    print(f"展品: {len(created_exhibits)} 件")
    print(f"活动: {len(created_activities)} 个")

except Exception as e:
    print(f"初始化数据出错: {e}")
    db.rollback()
finally:
    db.close()
