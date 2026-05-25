from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from . import models, schemas
import uuid


def get_performances(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Performance).offset(skip).limit(limit).all()


def get_performance(db: Session, performance_id: int):
    return db.query(models.Performance).filter(models.Performance.id == performance_id).first()


def create_performance(db: Session, performance: schemas.PerformanceCreate):
    db_performance = models.Performance(**performance.model_dump())
    db.add(db_performance)
    db.flush()

    db_reception = models.Reception(
        performance_id=db_performance.id,
        hotel="待安排",
        room_count=0,
        meal_count=0,
        transportation="待安排",
        notes="演出创建时自动生成，需要补充接待详情",
        status="pending",
        created_by="system"
    )
    db.add(db_reception)

    db_settlement = models.Settlement(
        performance_id=db_performance.id,
        performance_fee=0,
        hotel_expense=0,
        meal_expense=0,
        transportation_expense=0,
        other_expense=0,
        total_amount=0,
        ticket_revenue=0,
        status="pending",
        created_by="system"
    )
    db.add(db_settlement)

    create_status_history(db, schemas.StatusHistoryCreate(
        performance_id=db_performance.id,
        entity_type="performance",
        entity_id=db_performance.id,
        old_status="none",
        new_status="scheduled",
        changed_by="system",
        change_reason=f"新建演出: {db_performance.name}"
    ))

    db.commit()
    db.refresh(db_performance)
    return db_performance


def update_performance(db: Session, performance_id: int, performance: schemas.PerformanceUpdate):
    db_performance = get_performance(db, performance_id)
    if db_performance:
        old_status = db_performance.status
        old_start_time = db_performance.start_time
        old_venue = db_performance.venue
        
        for key, value in performance.model_dump(exclude_unset=True).items():
            setattr(db_performance, key, value)
        
        if performance.status and performance.status != old_status:
            create_status_history(db, schemas.StatusHistoryCreate(
                performance_id=performance_id,
                entity_type="performance",
                entity_id=performance_id,
                old_status=old_status,
                new_status=performance.status,
                changed_by="system",
                change_reason=f"演出状态变更"
            ))

        if performance.start_time and performance.start_time != old_start_time:
            create_status_history(db, schemas.StatusHistoryCreate(
                performance_id=performance_id,
                entity_type="performance",
                entity_id=performance_id,
                old_status=old_start_time.strftime("%Y-%m-%d %H:%M"),
                new_status=performance.start_time.strftime("%Y-%m-%d %H:%M"),
                changed_by="system",
                change_reason="演出时间变更"
            ))

        if performance.venue and performance.venue != old_venue:
            create_status_history(db, schemas.StatusHistoryCreate(
                performance_id=performance_id,
                entity_type="performance",
                entity_id=performance_id,
                old_status=old_venue,
                new_status=performance.venue,
                changed_by="system",
                change_reason="演出场地变更"
            ))

        db.commit()
        db.refresh(db_performance)
    return db_performance


def delete_performance(db: Session, performance_id: int):
    db_performance = get_performance(db, performance_id)
    if db_performance:
        create_status_history(db, schemas.StatusHistoryCreate(
            performance_id=performance_id,
            entity_type="performance",
            entity_id=performance_id,
            old_status=db_performance.status,
            new_status="deleted",
            changed_by="system",
            change_reason=f"删除演出: {db_performance.name}"
        ))
        db.delete(db_performance)
        db.commit()
    return db_performance


def get_artists(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Artist).offset(skip).limit(limit).all()


def get_artist(db: Session, artist_id: int):
    return db.query(models.Artist).filter(models.Artist.id == artist_id).first()


def create_artist(db: Session, artist: schemas.ArtistCreate):
    db_artist = models.Artist(**artist.model_dump())
    db.add(db_artist)
    db.commit()
    db.refresh(db_artist)
    return db_artist


def get_receptions(db: Session, skip: int = 0, limit: int = 100, status: str = None):
    query = db.query(models.Reception)
    if status:
        query = query.filter(models.Reception.status == status)
    return query.offset(skip).limit(limit).all()


def get_reception(db: Session, reception_id: int):
    return db.query(models.Reception).filter(models.Reception.id == reception_id).first()


def create_reception(db: Session, reception: schemas.ReceptionCreate):
    db_reception = models.Reception(
        performance_id=reception.performance_id,
        hotel=reception.hotel,
        room_count=reception.room_count,
        meal_count=reception.meal_count,
        transportation=reception.transportation,
        notes=reception.notes,
        created_by="system"
    )
    db.add(db_reception)
    db.flush()

    for artist_data in reception.artists:
        db_ra = models.ReceptionArtist(
            reception_id=db_reception.id,
            artist_id=artist_data.artist_id,
            check_in=artist_data.check_in,
            room_number=artist_data.room_number
        )
        db.add(db_ra)

    db.commit()
    db.refresh(db_reception)
    return db_reception


def update_reception(db: Session, reception_id: int, reception: schemas.ReceptionUpdate):
    db_reception = get_reception(db, reception_id)
    if db_reception:
        old_status = db_reception.status
        
        field_labels = {
            "hotel": "酒店",
            "room_count": "房间数",
            "meal_count": "用餐人数",
            "transportation": "交通安排",
            "notes": "备注",
            "check_in_time": "入住时间",
            "check_out_time": "退房时间"
        }
        
        old_values = {}
        for field in field_labels.keys():
            old_values[field] = getattr(db_reception, field)
        
        update_data = reception.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_reception, key, value)
        
        if reception.status and reception.status != old_status:
            create_status_history(db, schemas.StatusHistoryCreate(
                performance_id=db_reception.performance_id,
                entity_type="reception",
                entity_id=reception_id,
                old_status=old_status,
                new_status=reception.status,
                changed_by="system",
                change_reason="接待状态更新"
            ))
        
        for field, label in field_labels.items():
            if field in update_data:
                old_val = old_values[field]
                new_val = update_data[field]
                if old_val != new_val:
                    old_str = str(old_val) if old_val is not None else "未设置"
                    new_str = str(new_val) if new_val is not None else "未设置"
                    create_status_history(db, schemas.StatusHistoryCreate(
                        performance_id=db_reception.performance_id,
                        entity_type="reception_field",
                        entity_id=reception_id,
                        old_status=old_str,
                        new_status=new_str,
                        changed_by="system",
                        change_reason=f"接待{label}变更"
                    ))
        
        db.commit()
        db.refresh(db_reception)
    return db_reception


def get_settlements(db: Session, skip: int = 0, limit: int = 100, status: str = None):
    query = db.query(models.Settlement)
    if status:
        query = query.filter(models.Settlement.status == status)
    return query.offset(skip).limit(limit).all()


def get_settlement(db: Session, settlement_id: int):
    return db.query(models.Settlement).filter(models.Settlement.id == settlement_id).first()


def create_settlement(db: Session, settlement: schemas.SettlementCreate):
    total = (settlement.performance_fee + settlement.hotel_expense + 
             settlement.meal_expense + settlement.transportation_expense + 
             settlement.other_expense)
    db_settlement = models.Settlement(
        **settlement.model_dump(),
        total_amount=total,
        created_by="system"
    )
    db.add(db_settlement)
    db.commit()
    db.refresh(db_settlement)
    return db_settlement


def update_settlement(db: Session, settlement_id: int, settlement: schemas.SettlementUpdate):
    db_settlement = get_settlement(db, settlement_id)
    if db_settlement:
        old_status = db_settlement.status
        
        field_labels = {
            "performance_fee": "演出费",
            "hotel_expense": "酒店费",
            "meal_expense": "餐费",
            "transportation_expense": "交通费",
            "other_expense": "其他费用",
            "ticket_revenue": "票房收入"
        }
        
        old_values = {}
        for field in field_labels.keys():
            old_values[field] = getattr(db_settlement, field)
        
        update_data = settlement.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_settlement, key, value)
        
        db_settlement.total_amount = (
            db_settlement.performance_fee + db_settlement.hotel_expense + 
            db_settlement.meal_expense + db_settlement.transportation_expense + 
            db_settlement.other_expense
        )
        
        if settlement.status and settlement.status != old_status:
            if settlement.status == "approved":
                db_settlement.approval_time = datetime.now()
            create_status_history(db, schemas.StatusHistoryCreate(
                performance_id=db_settlement.performance_id,
                entity_type="settlement",
                entity_id=settlement_id,
                old_status=old_status,
                new_status=settlement.status,
                changed_by=settlement.approver or "system",
                change_reason=settlement.approval_notes or "结算状态更新"
            ))
        
        for field, label in field_labels.items():
            if field in update_data:
                old_val = old_values[field]
                new_val = update_data[field]
                if old_val != new_val:
                    old_str = f"¥{old_val:,.2f}" if isinstance(old_val, (int, float)) else str(old_val)
                    new_str = f"¥{new_val:,.2f}" if isinstance(new_val, (int, float)) else str(new_val)
                    create_status_history(db, schemas.StatusHistoryCreate(
                        performance_id=db_settlement.performance_id,
                        entity_type="settlement_field",
                        entity_id=settlement_id,
                        old_status=old_str,
                        new_status=new_str,
                        changed_by="system",
                        change_reason=f"结算{label}变更"
                    ))
        
        db.commit()
        db.refresh(db_settlement)
    return db_settlement


def create_status_history(db: Session, history: schemas.StatusHistoryCreate):
    db_history = models.StatusHistory(**history.model_dump())
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history


def get_status_history(db: Session, performance_id: int = None, skip: int = 0, limit: int = 100):
    query = db.query(models.StatusHistory)
    if performance_id:
        query = query.filter(models.StatusHistory.performance_id == performance_id)
    return query.order_by(models.StatusHistory.created_at.desc()).offset(skip).limit(limit).all()


def get_ticket_orders(db: Session, performance_id: int = None, skip: int = 0, limit: int = 100, status: str = None):
    query = db.query(models.TicketOrder)
    if performance_id:
        query = query.filter(models.TicketOrder.performance_id == performance_id)
    if status:
        query = query.filter(models.TicketOrder.status == status)
    return query.order_by(models.TicketOrder.created_at.desc()).offset(skip).limit(limit).all()


def get_ticket_order(db: Session, order_id: int):
    return db.query(models.TicketOrder).filter(models.TicketOrder.id == order_id).first()


def create_ticket_order(db: Session, order: schemas.TicketOrderCreate):
    order_no = f"TK{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
    db_order = models.TicketOrder(**order.model_dump(), order_no=order_no)
    db.add(db_order)
    
    performance = get_performance(db, order.performance_id)
    if performance:
        performance.sold_tickets += order.ticket_count
    
    db.commit()
    db.refresh(db_order)
    return db_order


def update_ticket_order(db: Session, order_id: int, order: schemas.TicketOrderUpdate):
    db_order = get_ticket_order(db, order_id)
    if db_order:
        old_status = db_order.status
        
        if order.status == "refund_pending" and (old_status == "confirmed" or old_status == "refund_rejected"):
            db_order.refund_applicant = order.refund_applicant or "customer"
            db_order.refund_reason = order.refund_reason or ""
            db_order.status = "refund_pending"
            create_status_history(db, schemas.StatusHistoryCreate(
                performance_id=db_order.performance_id,
                entity_type="ticket",
                entity_id=order_id,
                old_status=old_status,
                new_status="refund_pending",
                changed_by=order.refund_applicant or "customer",
                change_reason=f"申请退票: {order.refund_reason or ''}"
            ))
        
        elif order.status == "refunded" and old_status == "refund_pending":
            db_order.refund_approver = order.refund_approver or "system"
            db_order.refund_approval_time = datetime.now()
            db_order.refund_approval_notes = order.refund_approval_notes or ""
            db_order.status = "refunded"
            
            performance = get_performance(db, db_order.performance_id)
            if performance:
                performance.sold_tickets -= db_order.ticket_count
            
            create_status_history(db, schemas.StatusHistoryCreate(
                performance_id=db_order.performance_id,
                entity_type="ticket",
                entity_id=order_id,
                old_status=old_status,
                new_status="refunded",
                changed_by=order.refund_approver or "system",
                change_reason=f"退票通过: {order.refund_approval_notes or ''}"
            ))
        
        elif order.status == "refund_rejected" and old_status == "refund_pending":
            db_order.refund_approver = order.refund_approver or "system"
            db_order.refund_approval_notes = order.refund_approval_notes or "退票申请被驳回"
            db_order.status = "refund_rejected"
            
            create_status_history(db, schemas.StatusHistoryCreate(
                performance_id=db_order.performance_id,
                entity_type="ticket",
                entity_id=order_id,
                old_status=old_status,
                new_status="refund_rejected",
                changed_by=order.refund_approver or "system",
                change_reason=f"退票驳回: {order.refund_approval_notes or ''}"
            ))
        
        db.commit()
        db.refresh(db_order)
    return db_order


def get_dashboard_stats(db: Session):
    today = datetime.now().date()
    month_start = today.replace(day=1)
    
    pending_receptions = db.query(models.Reception).filter(models.Reception.status == "pending").count()
    pending_settlements = db.query(models.Settlement).filter(models.Settlement.status == "pending").count()
    rejected_settlements = db.query(models.Settlement).filter(models.Settlement.status == "rejected").count()
    need_review = db.query(models.Settlement).filter(models.Settlement.status == "reviewing").count()
    
    pending_refunds = db.query(models.TicketOrder).filter(models.TicketOrder.status == "refund_pending").count()
    rejected_refunds = db.query(models.TicketOrder).filter(models.TicketOrder.status == "refund_rejected").count()
    
    today_performances = db.query(models.Performance).filter(
        func.date(models.Performance.start_time) == today
    ).count()
    
    this_month_revenue = db.query(func.sum(models.Settlement.ticket_revenue)).filter(
        models.Settlement.created_at >= month_start,
        models.Settlement.status == "approved"
    ).scalar() or 0
    
    return schemas.DashboardStats(
        pending_receptions=pending_receptions,
        pending_settlements=pending_settlements,
        rejected_settlements=rejected_settlements,
        need_review=need_review,
        today_performances=today_performances,
        this_month_revenue=float(this_month_revenue),
        pending_refunds=pending_refunds,
        rejected_refunds=rejected_refunds
    )
