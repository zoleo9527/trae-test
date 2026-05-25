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
    db.commit()
    db.refresh(db_performance)
    return db_performance


def update_performance(db: Session, performance_id: int, performance: schemas.PerformanceUpdate):
    db_performance = get_performance(db, performance_id)
    if db_performance:
        for key, value in performance.model_dump(exclude_unset=True).items():
            setattr(db_performance, key, value)
        db.commit()
        db.refresh(db_performance)
    return db_performance


def delete_performance(db: Session, performance_id: int):
    db_performance = get_performance(db, performance_id)
    if db_performance:
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
        for key, value in reception.model_dump(exclude_unset=True).items():
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
        for key, value in settlement.model_dump(exclude_unset=True).items():
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


def get_ticket_orders(db: Session, performance_id: int = None, skip: int = 0, limit: int = 100):
    query = db.query(models.TicketOrder)
    if performance_id:
        query = query.filter(models.TicketOrder.performance_id == performance_id)
    return query.order_by(models.TicketOrder.created_at.desc()).offset(skip).limit(limit).all()


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
    db_order = db.query(models.TicketOrder).filter(models.TicketOrder.id == order_id).first()
    if db_order:
        if order.status == "refunded" and db_order.status != "refunded":
            performance = get_performance(db, db_order.performance_id)
            if performance:
                performance.sold_tickets -= db_order.ticket_count
        for key, value in order.model_dump(exclude_unset=True).items():
            setattr(db_order, key, value)
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
        this_month_revenue=float(this_month_revenue)
    )
