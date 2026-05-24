from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="家装监理-工地巡检与整改复查系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def init_demo_data(db: Session):
    if db.query(models.User).count() > 0:
        return

    users = [
        models.User(username="supervisor1", name="张监理", role="supervisor", email="zhang@example.com"),
        models.User(username="manager1", name="李管家", role="manager", email="li@example.com"),
        models.User(username="service1", name="王客服", role="service", email="wang@example.com"),
        models.User(username="worker1", name="陈工长", role="worker", email="chen@example.com"),
    ]
    db.add_all(users)
    db.commit()

    projects = [
        models.Project(name="万科翡翠滨江3栋1502", address="上海市浦东新区滨江大道88号", owner_name="刘先生", owner_phone="13800138001", stage="泥木阶段"),
        models.Project(name="恒大华府2栋801", address="上海市浦东新区华府路66号", owner_name="赵女士", owner_phone="13800138002", stage="水电阶段"),
        models.Project(name="保利天汇5栋2203", address="上海市徐汇区天汇路128号", owner_name="孙先生", owner_phone="13800138003", stage="油漆阶段"),
    ]
    db.add_all(projects)
    db.commit()

    now = datetime.now()

    inspection1 = models.Inspection(
        project_id=1, title="泥木工程中期巡检", type="routine", status="rectifying",
        priority="high", description="卫生间防水发现问题，需要立即整改",
        created_by=1, assigned_to=4, inspection_date=now - timedelta(days=2)
    )
    inspection2 = models.Inspection(
        project_id=2, title="水电工程验收", type="acceptance", status="completed",
        priority="normal", description="水电工程已完成验收",
        created_by=1, assigned_to=4, inspection_date=now - timedelta(days=5)
    )
    inspection3 = models.Inspection(
        project_id=3, title="油漆工程巡检", type="routine", status="pending",
        priority="normal", description="待进行油漆工程质量检查",
        created_by=1, assigned_to=4
    )
    inspection4 = models.Inspection(
        project_id=1, title="墙砖铺贴质量复检", type="review", status="disputed",
        priority="high", description="业主对整改结果有异议，需要重新确认",
        created_by=1, assigned_to=4, inspection_date=now - timedelta(days=4)
    )
    inspection5 = models.Inspection(
        project_id=2, title="隐蔽工程巡检", type="routine", status="rechecking",
        priority="urgent", description="整改完成待复查，已超期1天",
        created_by=1, assigned_to=4, inspection_date=now - timedelta(days=3)
    )

    db.add_all([inspection1, inspection2, inspection3, inspection4, inspection5])
    db.commit()

    issues = [
        models.Issue(inspection_id=1, title="卫生间防水层厚度不足", description="防水层实测仅1.2mm，要求达到1.5mm以上", category="waterproof", severity="critical", position="主卫地面"),
        models.Issue(inspection_id=1, title="地漏坡度不够", description="地漏周边坡度不足，存在积水风险", category="waterproof", severity="high", position="主卫地漏"),
        models.Issue(inspection_id=1, title="墙面平整度超标", description="墙面平整度实测误差4mm，超过规范要求", category="wall", severity="medium", position="客厅东墙"),
        models.Issue(inspection_id=2, title="接线盒未加盖板", description="部分接线盒未安装盖板", category="electric", severity="low", position="卧室墙面"),
        models.Issue(inspection_id=4, title="墙砖空鼓率超标", description="抽检20块墙砖，空鼓3块，超过5%标准", category="tile", severity="high", position="厨房墙面"),
        models.Issue(inspection_id=4, title="阴阳角不垂直", description="阴角垂直度偏差超过规范", category="tile", severity="medium", position="厨房转角"),
        models.Issue(inspection_id=5, title="水管打压试验不合格", description="打压30分钟后压降超过0.05MPa", category="waterpipe", severity="critical", position="阳台水管"),
    ]
    db.add_all(issues)
    db.commit()

    day_5 = now - timedelta(days=5)
    day_4 = now - timedelta(days=4)
    day_3 = now - timedelta(days=3)
    day_2 = now - timedelta(days=2)
    day_1 = now - timedelta(days=1)

    inspection_histories = [
        models.StatusHistory(inspection_id=1, to_status="created", comment="巡检单创建", operator_id=1, created_at=day_2.replace(hour=8, minute=0)),
        models.StatusHistory(inspection_id=1, from_status="created", to_status="in_progress", comment="开始现场巡检", operator_id=1, created_at=day_2.replace(hour=9, minute=0)),
        models.StatusHistory(inspection_id=1, from_status="in_progress", to_status="rectifying", comment="发现3个问题，已派单整改", operator_id=1, created_at=day_2.replace(hour=11, minute=0)),
        models.StatusHistory(inspection_id=2, to_status="created", comment="巡检单创建", operator_id=1, created_at=day_5.replace(hour=8, minute=0)),
        models.StatusHistory(inspection_id=2, from_status="created", to_status="in_progress", comment="开始现场巡检", operator_id=1, created_at=day_5.replace(hour=9, minute=0)),
        models.StatusHistory(inspection_id=2, from_status="in_progress", to_status="completed", comment="验收通过，轻微问题现场整改", operator_id=1, created_at=day_5.replace(hour=12, minute=0)),
        models.StatusHistory(inspection_id=4, to_status="created", comment="复检单创建", operator_id=1, created_at=day_4.replace(hour=8, minute=0)),
        models.StatusHistory(inspection_id=4, from_status="created", to_status="in_progress", comment="现场复检", operator_id=1, created_at=day_4.replace(hour=10, minute=0)),
        models.StatusHistory(inspection_id=4, from_status="in_progress", to_status="rectifying", comment="发现墙砖问题，发起整改", operator_id=1, created_at=day_4.replace(hour=12, minute=0)),
        models.StatusHistory(inspection_id=4, from_status="rectifying", to_status="rechecking", comment="整改完成，待复查", operator_id=4, created_at=day_2.replace(hour=10, minute=0)),
        models.StatusHistory(inspection_id=4, from_status="rechecking", to_status="disputed", comment="业主对整改结果有异议，认为返工不彻底", operator_id=2, created_at=day_1.replace(hour=15, minute=0)),
        models.StatusHistory(inspection_id=5, to_status="created", comment="巡检单创建", operator_id=1, created_at=day_3.replace(hour=8, minute=0)),
        models.StatusHistory(inspection_id=5, from_status="created", to_status="in_progress", comment="开始现场巡检", operator_id=1, created_at=day_3.replace(hour=9, minute=0)),
        models.StatusHistory(inspection_id=5, from_status="in_progress", to_status="rectifying", comment="发现水管问题，派单整改", operator_id=1, created_at=day_3.replace(hour=11, minute=0)),
        models.StatusHistory(inspection_id=5, from_status="rectifying", to_status="rechecking", comment="施工方已完成整改，待复查", operator_id=4, created_at=day_1.replace(hour=9, minute=0)),
    ]
    db.add_all(inspection_histories)
    db.commit()

    rect1 = models.Rectification(
        inspection_id=1, title="卫生间防水问题整改", status="in_progress",
        description="针对防水层和地漏问题进行整改",
        deadline=now + timedelta(days=1), created_by=1, assigned_to=4
    )
    rect2 = models.Rectification(
        inspection_id=4, title="墙砖空鼓整改", status="disputed",
        description="墙砖空鼓问题整改后业主有异议",
        deadline=now - timedelta(days=2), created_by=1, assigned_to=4
    )
    rect3 = models.Rectification(
        inspection_id=5, title="水管打压问题整改", status="rechecking",
        description="水管打压不合格，重新施工后待复查",
        deadline=now - timedelta(days=1), created_by=1, assigned_to=4
    )

    db.add_all([rect1, rect2, rect3])
    db.commit()

    rect_items = [
        models.RectificationItem(rectification_id=1, issue_id=1, status="in_progress", rectification_method="重新涂刷防水层，确保厚度达标"),
        models.RectificationItem(rectification_id=1, issue_id=2, status="pending", rectification_method="调整地漏周边坡度"),
        models.RectificationItem(rectification_id=1, issue_id=3, status="completed", rectification_method="重新找平墙面", cost=800, cost_confirmed=True, actual_finish_date=now - timedelta(days=1, hours=15)),
        models.RectificationItem(rectification_id=2, issue_id=5, status="completed", rectification_method="返工重贴空鼓墙砖", cost=1500, cost_confirmed=False, actual_finish_date=now - timedelta(days=2, hours=16)),
        models.RectificationItem(rectification_id=2, issue_id=6, status="completed", rectification_method="修正阴阳角", cost=300, cost_confirmed=False, actual_finish_date=now - timedelta(days=2, hours=15)),
        models.RectificationItem(rectification_id=3, issue_id=7, status="rechecking", rectification_method="更换漏水接头，重新打压测试", cost=600, actual_finish_date=now - timedelta(days=1, hours=8)),
    ]
    db.add_all(rect_items)
    db.commit()

    rect_histories = [
        models.StatusHistory(rectification_id=1, to_status="created", comment="整改单创建", operator_id=1, created_at=day_2.replace(hour=11, minute=5)),
        models.StatusHistory(rectification_id=1, from_status="created", to_status="in_progress", comment="施工队开始整改", operator_id=4, created_at=day_2.replace(hour=14, minute=0)),
        models.StatusHistory(rectification_id=2, to_status="created", comment="整改单创建", operator_id=1, created_at=day_4.replace(hour=12, minute=5)),
        models.StatusHistory(rectification_id=2, from_status="created", to_status="in_progress", comment="开始墙砖整改", operator_id=4, created_at=day_3.replace(hour=9, minute=0)),
        models.StatusHistory(rectification_id=2, from_status="in_progress", to_status="completed", comment="整改完成提交", operator_id=4, created_at=day_2.replace(hour=10, minute=0)),
        models.StatusHistory(rectification_id=2, from_status="completed", to_status="rechecking", comment="监理开始复查", operator_id=1, created_at=day_2.replace(hour=14, minute=0)),
        models.StatusHistory(rectification_id=2, from_status="rechecking", to_status="disputed", comment="业主不认可整改质量，要求全部返工", operator_id=2, created_at=day_1.replace(hour=15, minute=0)),
        models.StatusHistory(rectification_id=3, to_status="created", comment="整改单创建", operator_id=1, created_at=day_3.replace(hour=11, minute=5)),
        models.StatusHistory(rectification_id=3, from_status="created", to_status="in_progress", comment="开始水管整改", operator_id=4, created_at=day_3.replace(hour=14, minute=0)),
        models.StatusHistory(rectification_id=3, from_status="in_progress", to_status="rechecking", comment="整改完成待复查", operator_id=4, created_at=day_1.replace(hour=9, minute=0)),
    ]
    db.add_all(rect_histories)
    db.commit()


@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    init_demo_data(db)


@app.get("/api/users", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()


@app.get("/api/users/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.get("/api/projects", response_model=List[schemas.Project])
def get_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).all()


@app.get("/api/inspections", response_model=List[schemas.Inspection])
def get_inspections(status: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Inspection)
    if status:
        query = query.filter(models.Inspection.status == status)
    return query.order_by(models.Inspection.created_at.desc()).all()


@app.get("/api/inspections/{inspection_id}", response_model=schemas.Inspection)
def get_inspection(inspection_id: int, db: Session = Depends(get_db)):
    inspection = db.query(models.Inspection).filter(models.Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return inspection


@app.post("/api/inspections", response_model=schemas.Inspection)
def create_inspection(data: schemas.InspectionCreate, db: Session = Depends(get_db)):
    inspection = models.Inspection(
        **data.model_dump(exclude={"issues", "operator_id"}),
        created_by=data.operator_id
    )
    db.add(inspection)
    db.flush()

    for issue_data in data.issues:
        issue = models.Issue(**issue_data.model_dump(), inspection_id=inspection.id)
        db.add(issue)

    history = models.StatusHistory(
        inspection_id=inspection.id,
        to_status=inspection.status,
        comment="巡检单创建",
        operator_id=data.operator_id
    )
    db.add(history)

    db.commit()
    db.refresh(inspection)
    return inspection


@app.patch("/api/inspections/{inspection_id}/status", response_model=schemas.Inspection)
def update_inspection_status(inspection_id: int, data: schemas.StatusUpdate, db: Session = Depends(get_db)):
    inspection = db.query(models.Inspection).filter(models.Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    old_status = inspection.status
    inspection.status = data.status
    inspection.version += 1

    history = models.StatusHistory(
        inspection_id=inspection.id,
        from_status=old_status,
        to_status=data.status,
        comment=data.comment,
        operator_id=data.operator_id
    )
    db.add(history)

    db.commit()
    db.refresh(inspection)
    return inspection


@app.post("/api/inspections/batch-status", response_model=List[schemas.Inspection])
def batch_update_inspection_status(data: schemas.BatchStatusUpdate, db: Session = Depends(get_db)):
    inspections = db.query(models.Inspection).filter(models.Inspection.id.in_(data.ids)).all()
    results = []

    for inspection in inspections:
        old_status = inspection.status
        inspection.status = data.status
        inspection.version += 1

        history = models.StatusHistory(
            inspection_id=inspection.id,
            from_status=old_status,
            to_status=data.status,
            comment=data.comment,
            operator_id=data.operator_id
        )
        db.add(history)
        results.append(inspection)

    db.commit()
    return results


@app.get("/api/rectifications", response_model=List[schemas.Rectification])
def get_rectifications(status: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Rectification)
    if status:
        query = query.filter(models.Rectification.status == status)
    return query.order_by(models.Rectification.created_at.desc()).all()


@app.get("/api/rectifications/{rectification_id}", response_model=schemas.Rectification)
def get_rectification(rectification_id: int, db: Session = Depends(get_db)):
    rectification = db.query(models.Rectification).filter(models.Rectification.id == rectification_id).first()
    if not rectification:
        raise HTTPException(status_code=404, detail="Rectification not found")
    return rectification


@app.post("/api/rectifications", response_model=schemas.Rectification)
def create_rectification(data: schemas.RectificationCreate, db: Session = Depends(get_db)):
    rectification = models.Rectification(
        **data.model_dump(exclude={"items", "operator_id"}),
        created_by=data.operator_id
    )
    db.add(rectification)
    db.flush()

    for item_data in data.items:
        item = models.RectificationItem(**item_data.model_dump(), rectification_id=rectification.id)
        db.add(item)

    rect_history = models.StatusHistory(
        rectification_id=rectification.id,
        to_status=rectification.status,
        comment="整改单创建",
        operator_id=data.operator_id
    )
    db.add(rect_history)

    inspection = db.query(models.Inspection).filter(models.Inspection.id == rectification.inspection_id).first()
    if inspection:
        inspection_old_status = inspection.status
        inspection.status = "rectifying"
        inspection.version += 1

        inspection_history = models.StatusHistory(
            inspection_id=inspection.id,
            from_status=inspection_old_status,
            to_status="rectifying",
            comment=f"已发起整改单 #{rectification.id}，进入整改流程",
            operator_id=data.operator_id
        )
        db.add(inspection_history)

    db.commit()
    db.refresh(rectification)
    return rectification


@app.patch("/api/rectifications/{rectification_id}/status", response_model=schemas.Rectification)
def update_rectification_status(rectification_id: int, data: schemas.StatusUpdate, db: Session = Depends(get_db)):
    rectification = db.query(models.Rectification).filter(models.Rectification.id == rectification_id).first()
    if not rectification:
        raise HTTPException(status_code=404, detail="Rectification not found")

    old_rect_status = rectification.status
    rectification.status = data.status
    rectification.version += 1

    rect_history = models.StatusHistory(
        rectification_id=rectification.id,
        from_status=old_rect_status,
        to_status=data.status,
        comment=data.comment,
        operator_id=data.operator_id
    )
    db.add(rect_history)

    if data.status == "rechecking":
        inspection = db.query(models.Inspection).filter(models.Inspection.id == rectification.inspection_id).first()
        if inspection:
            inspection_old_status = inspection.status
            inspection.status = "rechecking"
            inspection.version += 1

            inspection_history = models.StatusHistory(
                inspection_id=inspection.id,
                from_status=inspection_old_status,
                to_status="rechecking",
                comment=f"整改单 #{rectification.id} 已提交复查",
                operator_id=data.operator_id
            )
            db.add(inspection_history)

    db.commit()
    db.refresh(rectification)
    return rectification


@app.post("/api/rectifications/{rectification_id}/review", response_model=schemas.Rectification)
def review_rectification(rectification_id: int, data: schemas.ReviewRectification, db: Session = Depends(get_db)):
    rectification = db.query(models.Rectification).filter(models.Rectification.id == rectification_id).first()
    if not rectification:
        raise HTTPException(status_code=404, detail="Rectification not found")

    old_rect_status = rectification.status
    rectification.status = data.status
    rectification.review_comment = data.review_comment
    rectification.review_by = data.operator_id
    rectification.review_at = datetime.now()
    rectification.version += 1

    if data.item_results:
        for item_id, result in data.item_results.items():
            item = db.query(models.RectificationItem).filter(models.RectificationItem.id == int(item_id)).first()
            if item:
                item.status = result.get("status", item.status)
                item.review_comment = result.get("review_comment", item.review_comment)
                if result.get("status") == "passed":
                    item.actual_finish_date = datetime.now()

    review_comment = data.review_comment
    if data.status == "disputed" and data.dispute_reason:
        review_comment = f"异议原因：{data.dispute_reason}"
        if data.review_comment:
            review_comment = f"{data.review_comment} | {review_comment}"

    rect_history = models.StatusHistory(
        rectification_id=rectification.id,
        from_status=old_rect_status,
        to_status=data.status,
        comment=review_comment,
        operator_id=data.operator_id
    )
    db.add(rect_history)

    inspection = db.query(models.Inspection).filter(models.Inspection.id == rectification.inspection_id).first()
    if inspection:
        inspection_old_status = inspection.status
        if data.status == "passed":
            inspection.status = "completed"
            inspection.version += 1
            inspection_history = models.StatusHistory(
                inspection_id=inspection.id,
                from_status=inspection_old_status,
                to_status="completed",
                comment="整改复查通过，巡检完成",
                operator_id=data.operator_id
            )
            db.add(inspection_history)
        elif data.status == "failed":
            inspection.status = "rectifying"
            inspection.version += 1
            inspection_history = models.StatusHistory(
                inspection_id=inspection.id,
                from_status=inspection_old_status,
                to_status="rectifying",
                comment="整改复查不通过，需重新整改",
                operator_id=data.operator_id
            )
            db.add(inspection_history)
        elif data.status == "disputed":
            inspection.status = "disputed"
            inspection.version += 1
            inspection_history = models.StatusHistory(
                inspection_id=inspection.id,
                from_status=inspection_old_status,
                to_status="disputed",
                comment=f"整改复查存在异议：{data.dispute_reason or '未说明原因'}",
                operator_id=data.operator_id
            )
            db.add(inspection_history)

    db.commit()
    db.refresh(rectification)
    return rectification


@app.patch("/api/rectification-items/{item_id}/confirm-cost", response_model=schemas.RectificationItem)
def confirm_cost(item_id: int, data: schemas.CostConfirm, db: Session = Depends(get_db)):
    item = db.query(models.RectificationItem).filter(models.RectificationItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Rectification item not found")

    item.cost = data.cost
    item.cost_confirmed = True
    item.cost_confirmed_at = datetime.now()
    item.cost_confirmed_by = data.operator_id

    db.commit()
    db.refresh(item)
    return item


@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_inspections = db.query(models.Inspection).count()
    pending_inspections = db.query(models.Inspection).filter(models.Inspection.status == "pending").count()
    rectifying = db.query(models.Inspection).filter(models.Inspection.status == "rectifying").count()
    rechecking = db.query(models.Inspection).filter(models.Inspection.status == "rechecking").count()
    disputed = db.query(models.Inspection).filter(models.Inspection.status == "disputed").count()
    completed = db.query(models.Inspection).filter(models.Inspection.status == "completed").count()

    overdue = db.query(models.Rectification).filter(
        models.Rectification.deadline < datetime.now(),
        models.Rectification.status.notin_(["completed", "passed"])
    ).count()

    return {
        "total_inspections": total_inspections,
        "pending_inspections": pending_inspections,
        "rectifying": rectifying,
        "rechecking": rechecking,
        "disputed": disputed,
        "completed": completed,
        "overdue_rectifications": overdue
    }


@app.get("/api/status-history/{type}/{id}")
def get_status_history(type: str, id: int, db: Session = Depends(get_db)):
    if type == "inspection":
        histories = db.query(models.StatusHistory).filter(models.StatusHistory.inspection_id == id).order_by(models.StatusHistory.created_at).all()
    elif type == "rectification":
        histories = db.query(models.StatusHistory).filter(models.StatusHistory.rectification_id == id).order_by(models.StatusHistory.created_at).all()
    else:
        raise HTTPException(status_code=400, detail="Invalid type")
    return histories
