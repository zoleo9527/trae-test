from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional, List
from app import models, schemas


def generate_repair_no(db: Session) -> str:
    today = date.today()
    prefix = f"RP{today.strftime('%Y%m%d')}"
    last = db.query(models.RepairOrder).filter(
        models.RepairOrder.repair_no.like(f"{prefix}%")
    ).order_by(models.RepairOrder.repair_no.desc()).first()
    if last:
        seq = int(last.repair_no[-4:]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def generate_transfer_no(db: Session) -> str:
    today = date.today()
    prefix = f"LT{today.strftime('%Y%m%d')}"
    last = db.query(models.LensTransfer).filter(
        models.LensTransfer.transfer_no.like(f"{prefix}%")
    ).order_by(models.LensTransfer.transfer_no.desc()).first()
    if last:
        seq = int(last.transfer_no[-4:]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def generate_refund_no(db: Session) -> str:
    today = date.today()
    prefix = f"RF{today.strftime('%Y%m%d')}"
    last = db.query(models.RefundRecord).filter(
        models.RefundRecord.refund_no.like(f"{prefix}%")
    ).order_by(models.RefundRecord.refund_no.desc()).first()
    if last:
        seq = int(last.refund_no[-4:]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def generate_visit_no(db: Session) -> str:
    today = date.today()
    prefix = f"VS{today.strftime('%Y%m%d')}"
    last = db.query(models.VisitRecord).filter(
        models.VisitRecord.visit_no.like(f"{prefix}%")
    ).order_by(models.VisitRecord.visit_no.desc()).first()
    if last:
        seq = int(last.visit_no[-4:]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def create_optometry_order(db: Session, obj: schemas.OptometryOrderCreate) -> models.OptometryOrder:
    db_obj = models.OptometryOrder(**obj.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_optometry_orders(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    keyword: Optional[str] = None,
    store: Optional[str] = None,
) -> List[models.OptometryOrder]:
    query = db.query(models.OptometryOrder)
    if keyword:
        query = query.filter(
            or_(
                models.OptometryOrder.order_no.contains(keyword),
                models.OptometryOrder.customer_name.contains(keyword),
                models.OptometryOrder.customer_phone.contains(keyword),
            )
        )
    if store:
        query = query.filter(models.OptometryOrder.store_name == store)
    return query.order_by(models.OptometryOrder.created_at.desc()).offset(skip).limit(limit).all()


def get_optometry_order(db: Session, id: int) -> Optional[models.OptometryOrder]:
    return db.query(models.OptometryOrder).filter(models.OptometryOrder.id == id).first()


def get_optometry_order_by_no(db: Session, order_no: str) -> Optional[models.OptometryOrder]:
    return db.query(models.OptometryOrder).filter(models.OptometryOrder.order_no == order_no).first()


def create_repair_order(db: Session, obj: schemas.RepairOrderCreate) -> models.RepairOrder:
    data = obj.model_dump()
    if obj.optometry_order_id:
        opt = get_optometry_order(db, obj.optometry_order_id)
        if opt:
            data["customer_name"] = opt.customer_name
            data["customer_phone"] = opt.customer_phone
            data["store_name"] = opt.store_name
            data["optometry_order_no"] = opt.order_no
    db_obj = models.RepairOrder(**data)
    db.add(db_obj)
    db.flush()
    history = models.StatusHistory(
        repair_order_id=db_obj.id,
        from_status=None,
        to_status=obj.status or "待处理",
        changed_by=obj.handler or "系统",
        change_reason="创建返修单",
    )
    db.add(history)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_repair_orders(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    store: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> List[models.RepairOrder]:
    query = db.query(models.RepairOrder)
    if status:
        query = query.filter(models.RepairOrder.status == status)
    if keyword:
        query = query.filter(
            or_(
                models.RepairOrder.repair_no.contains(keyword),
                models.RepairOrder.customer_name.contains(keyword),
                models.RepairOrder.optometry_order_no.contains(keyword),
            )
        )
    if store:
        query = query.filter(models.RepairOrder.store_name == store)
    if date_from:
        query = query.filter(models.RepairOrder.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(models.RepairOrder.created_at <= datetime.combine(date_to, datetime.max.time()))
    return query.order_by(models.RepairOrder.created_at.desc()).offset(skip).limit(limit).all()


def get_repair_order(db: Session, id: int) -> Optional[models.RepairOrder]:
    return db.query(models.RepairOrder).filter(models.RepairOrder.id == id).first()


def update_repair_order_status(
    db: Session,
    id: int,
    new_status: str,
    changed_by: str,
    change_reason: Optional[str] = None,
    extra_updates: Optional[dict] = None,
) -> Optional[models.RepairOrder]:
    db_obj = get_repair_order(db, id)
    if not db_obj:
        return None
    old_status = db_obj.status
    db_obj.status = new_status
    db_obj.updated_at = datetime.now()
    if extra_updates:
        for key, value in extra_updates.items():
            setattr(db_obj, key, value)
    history = models.StatusHistory(
        repair_order_id=id,
        from_status=old_status,
        to_status=new_status,
        changed_by=changed_by,
        change_reason=change_reason,
    )
    db.add(history)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_repair_order(db: Session, id: int, obj: schemas.RepairOrderUpdate) -> Optional[models.RepairOrder]:
    db_obj = get_repair_order(db, id)
    if not db_obj:
        return None
    update_data = obj.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] != db_obj.status:
        history = models.StatusHistory(
            repair_order_id=id,
            from_status=db_obj.status,
            to_status=update_data["status"],
            changed_by=update_data.get("handler", db_obj.handler or "系统"),
            change_reason="状态更新",
        )
        db.add(history)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    db_obj.updated_at = datetime.now()
    db.commit()
    db.refresh(db_obj)
    return db_obj


def batch_update_repair_orders(
    db: Session,
    ids: List[int],
    status: Optional[str] = None,
    processor: Optional[str] = None,
    handler: Optional[str] = None,
    changed_by: str = "系统",
) -> int:
    if status:
        repairs = db.query(models.RepairOrder).filter(models.RepairOrder.id.in_(ids)).all()
        for r in repairs:
            old_status = r.status
            r.status = status
            r.updated_at = datetime.now()
            if processor:
                r.processor = processor
            if handler:
                r.handler = handler
            history = models.StatusHistory(
                repair_order_id=r.id,
                from_status=old_status,
                to_status=status,
                changed_by=changed_by,
                change_reason="批量更新",
            )
            db.add(history)
        db.commit()
        return len(repairs)
    else:
        query = db.query(models.RepairOrder).filter(models.RepairOrder.id.in_(ids))
        updates = {"updated_at": datetime.now()}
        if processor:
            updates["processor"] = processor
        if handler:
            updates["handler"] = handler
        count = query.update(updates, synchronize_session="fetch")
        db.commit()
        return count


def delete_repair_order(db: Session, id: int) -> bool:
    db_obj = get_repair_order(db, id)
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False


def create_lens_transfer(db: Session, obj: schemas.LensTransferCreate) -> models.LensTransfer:
    db_obj = models.LensTransfer(**obj.model_dump())
    db.add(db_obj)
    if obj.repair_order_id:
        repair = get_repair_order(db, obj.repair_order_id)
        if repair:
            old_status = repair.status
            repair.lens_status = "调拨中"
            if repair.status not in ["镜片调拨中", "镜片丢失"]:
                repair.status = "镜片调拨中"
            repair.updated_at = datetime.now()
            if old_status != repair.status:
                history = models.StatusHistory(
                    repair_order_id=repair.id,
                    from_status=old_status,
                    to_status=repair.status,
                    changed_by=obj.status or "系统",
                    change_reason="创建镜片调拨单",
                )
                db.add(history)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_lens_transfers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    is_lost: Optional[int] = None,
) -> List[models.LensTransfer]:
    query = db.query(models.LensTransfer)
    if status:
        query = query.filter(models.LensTransfer.status == status)
    if is_lost is not None:
        query = query.filter(models.LensTransfer.is_lost == is_lost)
    return query.order_by(models.LensTransfer.created_at.desc()).offset(skip).limit(limit).all()


def get_lens_transfer(db: Session, id: int) -> Optional[models.LensTransfer]:
    return db.query(models.LensTransfer).filter(models.LensTransfer.id == id).first()


def update_lens_transfer(db: Session, id: int, obj: schemas.LensTransferUpdate) -> Optional[models.LensTransfer]:
    db_obj = get_lens_transfer(db, id)
    if not db_obj:
        return None
    update_data = obj.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    db_obj.updated_at = datetime.now()
    if db_obj.repair_order_id:
        repair = get_repair_order(db, db_obj.repair_order_id)
        if repair:
            new_repair_status = None
            change_reason = None
            status_val = update_data.get('status', db_obj.status)
            is_lost_val = update_data.get('is_lost', db_obj.is_lost)
            if is_lost_val == 1:
                repair.lens_status = "已丢失"
                if repair.status != "镜片丢失":
                    new_repair_status = "镜片丢失"
                    change_reason = "镜片调拨丢失"
            elif status_val == "已收货":
                repair.lens_status = "库存充足"
                if repair.status in ["镜片调拨中", "待镜片"]:
                    new_repair_status = "处理中"
                    change_reason = "镜片已到货，恢复处理"
            elif status_val == "已发货":
                repair.lens_status = "调拨中"
            if new_repair_status and repair.status != new_repair_status:
                old_repair_status = repair.status
                repair.status = new_repair_status
                repair.updated_at = datetime.now()
                history = models.StatusHistory(
                    repair_order_id=repair.id,
                    from_status=old_repair_status,
                    to_status=new_repair_status,
                    changed_by="系统",
                    change_reason=change_reason,
                )
                db.add(history)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def create_refund_record(db: Session, obj: schemas.RefundRecordCreate) -> models.RefundRecord:
    db_obj = models.RefundRecord(**obj.model_dump())
    db.add(db_obj)
    if obj.repair_order_id:
        repair = get_repair_order(db, obj.repair_order_id)
        if repair and repair.status != "退款中" and repair.status != "已退款":
            old_status = repair.status
            repair.status = "退款中"
            repair.refund_amount = obj.amount
            repair.refund_reason = obj.reason
            repair.updated_at = datetime.now()
            history = models.StatusHistory(
                repair_order_id=repair.id,
                from_status=old_status,
                to_status="退款中",
                changed_by=obj.applicant or "系统",
                change_reason="创建退款申请",
            )
            db.add(history)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_refund_records(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
) -> List[models.RefundRecord]:
    query = db.query(models.RefundRecord)
    if status:
        query = query.filter(models.RefundRecord.status == status)
    return query.order_by(models.RefundRecord.created_at.desc()).offset(skip).limit(limit).all()


def get_refund_record(db: Session, id: int) -> Optional[models.RefundRecord]:
    return db.query(models.RefundRecord).filter(models.RefundRecord.id == id).first()


REFUND_FLOW = {
    "待审批": ["已审批", "已驳回"],
    "已审批": ["已退款", "已驳回"],
    "已退款": [],
    "已驳回": [],
}


def update_refund_record(db: Session, id: int, obj: schemas.RefundRecordUpdate) -> Optional[models.RefundRecord]:
    db_obj = get_refund_record(db, id)
    if not db_obj:
        return None
    update_data = obj.model_dump(exclude_unset=True)
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status not in REFUND_FLOW.get(db_obj.status, []):
            raise ValueError(f"退款状态不能从 {db_obj.status} 变更为 {new_status}，合法流转: {' → '.join(REFUND_FLOW.get(db_obj.status, [])) or '无'}")
        if new_status == "已退款":
            update_data["paid_at"] = update_data.get("paid_at") or datetime.now()
            if db_obj.repair_order_id:
                repair = get_repair_order(db, db_obj.repair_order_id)
                if repair:
                    old_repair_status = repair.status
                    repair.status = "已退款"
                    repair.updated_at = datetime.now()
                    history = models.StatusHistory(
                        repair_order_id=repair.id,
                        from_status=old_repair_status,
                        to_status="已退款",
                        changed_by=update_data.get("approver", "系统"),
                        change_reason="退款已完成",
                    )
                    db.add(history)
        elif new_status == "已驳回":
            if db_obj.repair_order_id:
                repair = get_repair_order(db, db_obj.repair_order_id)
                if repair and repair.status in ["退款中"]:
                    old_repair_status = repair.status
                    repair.status = "需回查"
                    repair.updated_at = datetime.now()
                    reject_reason = update_data.get("reject_reason", "退款申请被驳回")
                    history = models.StatusHistory(
                        repair_order_id=repair.id,
                        from_status=old_repair_status,
                        to_status="需回查",
                        changed_by=update_data.get("approver", "系统"),
                        change_reason=f"退款驳回: {reject_reason}",
                    )
                    db.add(history)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    db_obj.updated_at = datetime.now()
    db.commit()
    db.refresh(db_obj)
    return db_obj


def create_visit_record(db: Session, obj: schemas.VisitRecordCreate) -> models.VisitRecord:
    db_obj = models.VisitRecord(**obj.model_dump())
    db.add(db_obj)
    db.flush()
    if obj.repair_order_id:
        repair = get_repair_order(db, obj.repair_order_id)
        if repair:
            history = models.StatusHistory(
                repair_order_id=repair.id,
                from_status=repair.status,
                to_status=repair.status,
                changed_by=obj.visitor or "系统",
                change_reason=f"创建回访计划（{obj.visit_type}），计划日期：{obj.planned_date}",
            )
            db.add(history)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_visit_records(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> List[models.VisitRecord]:
    query = db.query(models.VisitRecord)
    if status:
        query = query.filter(models.VisitRecord.status == status)
    if date_from:
        query = query.filter(models.VisitRecord.planned_date >= date_from)
    if date_to:
        query = query.filter(models.VisitRecord.planned_date <= date_to)
    return query.order_by(models.VisitRecord.planned_date.asc()).offset(skip).limit(limit).all()


def get_visit_record(db: Session, id: int) -> Optional[models.VisitRecord]:
    return db.query(models.VisitRecord).filter(models.VisitRecord.id == id).first()


def update_visit_record(db: Session, id: int, obj: schemas.VisitRecordUpdate) -> Optional[models.VisitRecord]:
    db_obj = get_visit_record(db, id)
    if not db_obj:
        return None
    old_status = db_obj.status
    update_data = obj.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    db_obj.updated_at = datetime.now()
    new_status = update_data.get("status", old_status)
    if new_status == "已回访" and old_status != "已回访" and db_obj.repair_order_id:
        repair = get_repair_order(db, db_obj.repair_order_id)
        if repair and repair.status == "待处理":
            old_repair_status = repair.status
            repair.status = "处理中"
            repair.updated_at = datetime.now()
            history = models.StatusHistory(
                repair_order_id=repair.id,
                from_status=old_repair_status,
                to_status="处理中",
                changed_by=update_data.get("visitor", "系统"),
                change_reason="回访完成，开始处理",
            )
            db.add(history)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def batch_update_visit_records(
    db: Session,
    ids: List[int],
    status: Optional[str] = None,
    visitor: Optional[str] = None,
) -> int:
    visits = db.query(models.VisitRecord).filter(models.VisitRecord.id.in_(ids)).all()
    count = 0
    for v in visits:
        old_status = v.status
        if status:
            v.status = status
        if visitor:
            v.visitor = visitor
        v.updated_at = datetime.now()
        if status == "已回访" and old_status != "已回访" and v.repair_order_id:
            repair = get_repair_order(db, v.repair_order_id)
            if repair and repair.status == "待处理":
                old_repair_status = repair.status
                repair.status = "处理中"
                repair.updated_at = datetime.now()
                history = models.StatusHistory(
                    repair_order_id=repair.id,
                    from_status=old_repair_status,
                    to_status="处理中",
                    changed_by=visitor or "系统",
                    change_reason="回访完成，开始处理",
                )
                db.add(history)
        count += 1
    db.commit()
    return count


def get_dashboard_stats(db: Session) -> dict:
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    pending_count = db.query(func.count(models.RepairOrder.id)).filter(
        models.RepairOrder.status == "待处理"
    ).scalar()

    in_progress_count = db.query(func.count(models.RepairOrder.id)).filter(
        models.RepairOrder.status.in_(["处理中", "待镜片", "镜片调拨中", "返修中"])
    ).scalar()

    rejected_count = db.query(func.count(models.RepairOrder.id)).filter(
        models.RepairOrder.status == "已驳回"
    ).scalar()

    need_review_count = db.query(func.count(models.RepairOrder.id)).filter(
        models.RepairOrder.status == "需回查"
    ).scalar()

    lens_lost_count = db.query(func.count(models.RepairOrder.id)).filter(
        models.RepairOrder.status == "镜片丢失"
    ).scalar()

    refunding_count = db.query(func.count(models.RepairOrder.id)).filter(
        models.RepairOrder.status == "退款中"
    ).scalar()

    visit_pending_count = db.query(func.count(models.VisitRecord.id)).filter(
        models.VisitRecord.status == "待回访"
    ).scalar()

    total_today = db.query(func.count(models.RepairOrder.id)).filter(
        models.RepairOrder.created_at >= today_start,
        models.RepairOrder.created_at <= today_end,
    ).scalar()

    return {
        "pending_count": pending_count,
        "in_progress_count": in_progress_count,
        "rejected_count": rejected_count,
        "need_review_count": need_review_count,
        "lens_lost_count": lens_lost_count,
        "refunding_count": refunding_count,
        "visit_pending_count": visit_pending_count,
        "total_today": total_today,
    }


def get_status_history(db: Session, repair_order_id: int) -> List[models.StatusHistory]:
    return db.query(models.StatusHistory).filter(
        models.StatusHistory.repair_order_id == repair_order_id
    ).order_by(models.StatusHistory.changed_at.desc()).all()


def get_stores(db: Session) -> List[str]:
    result = db.query(models.RepairOrder.store_name).distinct().all()
    return [r[0] for r in result]


def get_repair_types(db: Session) -> List[str]:
    result = db.query(models.RepairOrder.repair_type).distinct().all()
    return [r[0] for r in result]
