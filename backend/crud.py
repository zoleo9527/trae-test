from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

import models
import schemas


def seed_database(db: Session):
    if db.query(models.Order).count() > 0:
        return

    orders = [
        {
            "order_no": "WS2026-0521",
            "customer_name": "陈一诺",
            "partner_name": "林子墨",
            "phone": "138****2101",
            "studio_branch": "外滩旗舰",
            "package": "奢华定制 · 三天两夜",
            "shoot_date": datetime(2026, 5, 3, 9, 0),
            "select_date": datetime(2026, 5, 8, 14, 0),
            "store_manager": "周敏",
            "selector": "方倩",
            "retoucher": "韩磊",
            "customer_service": "苏晓",
            "remark": "新娘对肤色要求高，主纱系列全部保留；外景第3张不要天空过曝。",
            "balance_status": "未结清",
            "status": "复核中",
        },
        {
            "order_no": "WS2026-0518",
            "customer_name": "顾念安",
            "partner_name": "沈砚舟",
            "phone": "139****8842",
            "studio_branch": "外滩旗舰",
            "package": "经典套系",
            "shoot_date": datetime(2026, 4, 28, 8, 30),
            "select_date": datetime(2026, 5, 2, 13, 0),
            "store_manager": "周敏",
            "selector": "方倩",
            "retoucher": "赵璐",
            "customer_service": "苏晓",
            "remark": "改期1次（由4/27改为4/28），已在档期表备注。",
            "balance_status": "未结清",
            "status": "复核中",
        },
        {
            "order_no": "WS2026-0430",
            "customer_name": "苏晚晴",
            "partner_name": "陆星野",
            "phone": "136****1120",
            "studio_branch": "静安会所",
            "package": "旅行拍 · 厦门",
            "shoot_date": datetime(2026, 4, 10, 7, 0),
            "select_date": datetime(2026, 4, 15, 10, 0),
            "store_manager": "沈岚",
            "selector": "方倩",
            "retoucher": "韩磊",
            "customer_service": "沈岚",
            "remark": "外景回查一次：天空色偏。第2次回传已通过。",
            "balance_status": "未结清",
            "status": "复核中",
        },
        {
            "order_no": "WS2026-0412",
            "customer_name": "赵可心",
            "partner_name": "陈禹辰",
            "phone": "137****7701",
            "studio_branch": "静安会所",
            "package": "经典套系",
            "shoot_date": datetime(2026, 3, 22, 9, 0),
            "select_date": datetime(2026, 3, 27, 14, 0),
            "store_manager": "沈岚",
            "selector": "林然",
            "retoucher": "赵璐",
            "customer_service": "沈岚",
            "remark": "尾款已结清。",
            "balance_status": "已结清",
            "status": "已完成",
        },
    ]

    for i, o in enumerate(orders):
        order = models.Order(**o)
        db.add(order)
        db.flush()

        batches = []
        if i == 0:
            batches = [
                models.Batch(batch_no=1, status="已通过", remark="初修回传",
                             delivered_at=datetime(2026, 5, 10, 18, 0)),
                models.Batch(batch_no=2, status="已驳回", remark="客户复核：主纱曝光与肤色",
                             delivered_at=datetime(2026, 5, 14, 20, 0)),
                models.Batch(batch_no=3, status="待复核", remark="回查二次回传",
                             delivered_at=datetime(2026, 5, 21, 19, 30)),
            ]
        elif i == 1:
            batches = [
                models.Batch(batch_no=1, status="已通过", remark="初修回传",
                             delivered_at=datetime(2026, 5, 5, 18, 0)),
                models.Batch(batch_no=2, status="待复核", remark="二次回传（改期后）",
                             delivered_at=datetime(2026, 5, 18, 19, 0)),
            ]
        elif i == 2:
            batches = [
                models.Batch(batch_no=1, status="已驳回", remark="初修回传",
                             delivered_at=datetime(2026, 4, 18, 18, 0)),
                models.Batch(batch_no=2, status="已通过", remark="回查一次",
                             delivered_at=datetime(2026, 4, 25, 19, 0)),
                models.Batch(batch_no=3, status="已回查", remark="回查二次（尾款前）",
                             delivered_at=datetime(2026, 4, 30, 20, 0)),
            ]
        else:
            batches = [
                models.Batch(batch_no=1, status="已通过", remark="初修回传",
                             delivered_at=datetime(2026, 3, 30, 18, 0)),
            ]

        photo_cats = ["主纱", "外景", "中式", "写真"]
        for bi, b in enumerate(batches):
            b.order_id = order.id
            db.add(b)
            db.flush()

            photo_count = 6 if bi < 2 else 4
            for pj in range(photo_count):
                cat = photo_cats[pj % len(photo_cats)]
                name = f"{order.order_no}_B{b.batch_no}_{pj+1:02d}_{cat}.jpg"
                status = "待复核"
                feedback = ""
                if b.status == "已通过":
                    status = "已通过"
                elif b.status == "已驳回":
                    status = "已驳回" if pj % 3 != 0 else "需回查"
                    feedback = "肤色偏冷，需要回暖；构图右下杂物需要修掉。" if status == "已驳回" else "天空色偏问题需回查。"
                elif b.status == "已回查":
                    status = "已通过" if pj % 2 == 0 else "需回查"
                elif b.status == "待复核" and pj == 0:
                    status = "需回查"
                    feedback = "天空色偏问题再次确认。"

                photo = models.Photo(
                    batch_id=b.id,
                    photo_name=name,
                    category=cat,
                    image_url=f"https://picsum.photos/seed/{name}/640/480",
                    version=b.batch_no,
                    review_status=status,
                    latest_feedback=feedback,
                )
                db.add(photo)
                db.flush()

                if b.status in ("已通过", "已驳回", "已回查"):
                    db.add(models.Review(
                        photo_id=photo.id,
                        reviewer="客户",
                        verdict="通过" if status == "已通过" else ("驳回" if status == "已驳回" else "回查"),
                        feedback=feedback or "整体OK。",
                        version_at_review=b.batch_no,
                        created_at=b.delivered_at + timedelta(hours=20 + pj),
                    ))
                    db.add(models.Review(
                        photo_id=photo.id,
                        reviewer="选片师",
                        verdict="通过" if status == "已通过" else "回查",
                        feedback="客户反馈已记录。",
                        version_at_review=b.batch_no,
                        created_at=b.delivered_at + timedelta(hours=22 + pj),
                    ))

        # timeline
        events = [
            models.TimelineEvent(order_id=order.id, event_type="拍摄",
                                 title=f"拍摄完成（{order.shoot_date.strftime('%Y-%m-%d')}）",
                                 detail=f"摄影师完成 {order.customer_name} 与 {order.partner_name} 拍摄",
                                 operator="摄影组"),
            models.TimelineEvent(order_id=order.id, event_type="选片",
                                 title="选片完成",
                                 detail=f"{order.selector} 陪同客户完成选片",
                                 operator=order.selector),
        ]
        for b in batches:
            events.append(models.TimelineEvent(
                order_id=order.id,
                event_type="回传",
                title=f"第 {b.batch_no} 次回传",
                detail=b.remark,
                operator=order.retoucher,
                created_at=b.delivered_at,
            ))
            if b.status in ("已驳回", "已回查"):
                events.append(models.TimelineEvent(
                    order_id=order.id,
                    event_type="回查",
                    title=f"第 {b.batch_no} 次回查结论",
                    detail=b.status,
                    operator=order.customer_service,
                    created_at=b.delivered_at + timedelta(days=1),
                ))
        if order.balance_status == "已结清":
            events.append(models.TimelineEvent(
                order_id=order.id,
                event_type="尾款",
                title="尾款结清",
                detail="客户确认尾款已支付",
                operator=order.store_manager,
                created_at=order.updated_at,
            ))

        for e in events:
            db.add(e)

    db.commit()


def _photo_status_counts_for_order(db: Session, order_id: int):
    rows = (
        db.query(models.Photo.review_status, func.count(models.Photo.id))
        .join(models.Batch, models.Photo.batch_id == models.Batch.id)
        .filter(models.Batch.order_id == order_id)
        .group_by(models.Photo.review_status)
        .all()
    )
    data = {"待复核": 0, "已驳回": 0, "需回查": 0, "已通过": 0}
    for s, c in rows:
        data[s] = c
    return data


def get_orders(db: Session, status: str | None = None, studio: str | None = None, keyword: str | None = None):
    q = db.query(models.Order)
    if status:
        q = q.filter(models.Order.status == status)
    if studio:
        q = q.filter(models.Order.studio_branch == studio)
    if keyword:
        like = f"%{keyword}%"
        q = q.filter(
            (models.Order.customer_name.like(like))
            | (models.Order.partner_name.like(like))
            | (models.Order.order_no.like(like))
        )
    orders = q.order_by(models.Order.updated_at.desc()).all()

    result = []
    for o in orders:
        counts = _photo_status_counts_for_order(db, o.id)
        latest_batch = db.query(models.Batch).filter(models.Batch.order_id == o.id).order_by(
            models.Batch.batch_no.desc()).first()
        item = schemas.OrderListItem(
            id=o.id,
            order_no=o.order_no,
            customer_name=o.customer_name,
            partner_name=o.partner_name,
            studio_branch=o.studio_branch,
            shoot_date=o.shoot_date,
            status=o.status,
            balance_status=o.balance_status,
            store_manager=o.store_manager,
            selector=o.selector,
            retoucher=o.retoucher,
            customer_service=o.customer_service,
            latest_batch_status=latest_batch.status if latest_batch else "",
            review_pending=counts["待复核"],
            review_rejected=counts["已驳回"],
            review_recheck=counts["需回查"],
            updated_at=o.updated_at,
        )
        result.append(item)
    return result


def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def get_dashboard(db: Session) -> schemas.DashboardStats:
    photo_stats = (
        db.query(models.Photo.review_status, func.count(models.Photo.id))
        .group_by(models.Photo.review_status)
        .all()
    )
    data = {"待复核": 0, "已驳回": 0, "需回查": 0, "已通过": 0}
    for s, c in photo_stats:
        data[s] = c

    return schemas.DashboardStats(
        order_total=db.query(models.Order).count(),
        review_pending=data["待复核"],
        review_rejected=data["已驳回"],
        review_recheck=data["需回查"],
        balance_unpaid=db.query(models.Order).filter(models.Order.balance_status == "未结清").count(),
        updated_at=datetime.utcnow(),
    )


def get_batch(db: Session, batch_id: int):
    return db.query(models.Batch).filter(models.Batch.id == batch_id).first()


def submit_review(db: Session, photo_id: int, payload: schemas.ReviewSubmit):
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if not photo:
        return None

    verdict_map = {"通过": "已通过", "驳回": "已驳回", "回查": "需回查"}
    new_status = verdict_map.get(payload.verdict, photo.review_status)
    photo.review_status = new_status
    if payload.feedback:
        photo.latest_feedback = payload.feedback

    review = models.Review(
        photo_id=photo.id,
        reviewer=payload.reviewer,
        verdict=payload.verdict,
        feedback=payload.feedback,
        version_at_review=photo.version,
    )
    db.add(review)

    # recalculate batch status after change
    batch = db.query(models.Batch).filter(models.Batch.id == photo.batch_id).first()
    if batch:
        photo_list = db.query(models.Photo).filter(models.Photo.batch_id == batch.id).all()
        statuses = {p.review_status for p in photo_list}
        if any(s == "已驳回" for s in statuses):
            batch.status = "已驳回"
        elif any(s == "需回查" for s in statuses):
            batch.status = "已回查"
        elif all(s == "已通过" for s in statuses):
            batch.status = "已通过"
        else:
            batch.status = "复核中"
        order = db.query(models.Order).filter(models.Order.id == batch.order_id).first()
        if order:
            order.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(photo)
    return photo


def resubmit_photo(db: Session, photo_id: int, payload: schemas.ResubmitPhoto):
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if not photo:
        return None
    photo.version += 1
    if payload.image_url:
        photo.image_url = payload.image_url
    photo.review_status = "待复核"
    photo.latest_feedback = payload.remark or ""
    photo.updated_at = datetime.utcnow()

    batch = db.query(models.Batch).filter(models.Batch.id == photo.batch_id).first()
    if batch:
        batch.status = "复核中"
        order = db.query(models.Order).filter(models.Order.id == batch.order_id).first()
        if order:
            order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(photo)
    return photo


def add_batch(db: Session, order_id: int, payload: schemas.BatchCreate):
    order = get_order(db, order_id)
    if not order:
        return None
    batch = models.Batch(
        order_id=order.id,
        batch_no=payload.batch_no,
        status="待复核",
        remark=payload.remark,
        delivered_at=datetime.utcnow(),
    )
    db.add(batch)
    db.flush()
    for p in payload.photos:
        photo = models.Photo(
            batch_id=batch.id,
            photo_name=p.photo_name,
            category=p.category,
            image_url=p.image_url,
            version=p.version if p.version else batch.batch_no,
            review_status="待复核",
            latest_feedback="",
        )
        db.add(photo)

    db.add(models.TimelineEvent(
        order_id=order.id,
        event_type="回传",
        title=f"第 {batch.batch_no} 次回传",
        detail=batch.remark,
        operator=order.retoucher,
        created_at=batch.delivered_at,
    ))
    order.status = "复核中"
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(batch)
    return batch


def update_order(db: Session, order_id: int, payload: dict):
    order = get_order(db, order_id)
    if not order:
        return None
    for k, v in payload.items():
        if hasattr(order, k) and v is not None:
            setattr(order, k, v)
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return order
