from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from . import models, schemas


def get_dashboard_stats(db: Session):
    pending_feedbacks = db.query(models.Feedback).filter(
        models.Feedback.status == models.FeedbackStatus.PENDING
    ).count()
    
    rejected_feedbacks = db.query(models.Feedback).filter(
        models.Feedback.status == models.FeedbackStatus.REJECTED
    ).count()
    
    pending_schedules = db.query(models.VolunteerSchedule).filter(
        models.VolunteerSchedule.status == models.ScheduleStatus.PENDING
    ).count()
    
    pending_transfers = db.query(models.ExhibitTransfer).filter(
        models.ExhibitTransfer.confirmed == False
    ).count()
    
    pending_tickets = db.query(models.Ticket).filter(
        models.Ticket.verification_status == models.VerificationStatus.PENDING
    ).count()
    
    needs_review_count = db.query(models.Feedback).filter(
        models.Feedback.needs_review == True
    ).count()
    
    return {
        "pending_feedbacks": pending_feedbacks,
        "rejected_feedbacks": rejected_feedbacks,
        "pending_schedules": pending_schedules,
        "pending_transfers": pending_transfers,
        "pending_tickets": pending_tickets,
        "needs_review_count": needs_review_count
    }


def get_pending_items(db: Session):
    pending_feedbacks = db.query(models.Feedback).filter(
        models.Feedback.status == models.FeedbackStatus.PENDING,
        models.Feedback.needs_review == False
    ).order_by(models.Feedback.created_at.desc()).limit(10).all()
    
    rejected_feedbacks = db.query(models.Feedback).filter(
        models.Feedback.status == models.FeedbackStatus.REJECTED
    ).order_by(models.Feedback.created_at.desc()).limit(5).all()
    
    needs_review = db.query(models.Feedback).filter(
        models.Feedback.needs_review == True
    ).order_by(models.Feedback.created_at.desc()).limit(5).all()
    
    pending_schedules = db.query(models.VolunteerSchedule).filter(
        models.VolunteerSchedule.status == models.ScheduleStatus.PENDING
    ).order_by(models.VolunteerSchedule.date).limit(5).all()
    
    pending_transfers = db.query(models.ExhibitTransfer).filter(
        models.ExhibitTransfer.confirmed == False
    ).order_by(models.ExhibitTransfer.created_at.desc()).limit(5).all()
    
    return {
        "pending_feedbacks": pending_feedbacks,
        "rejected_feedbacks": rejected_feedbacks,
        "needs_review": needs_review,
        "pending_schedules": pending_schedules,
        "pending_transfers": pending_transfers
    }


def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()


def get_volunteers(db: Session):
    return db.query(models.User).filter(models.User.role == models.UserRole.VOLUNTEER).all()


def create_schedule(db: Session, schedule: schemas.VolunteerScheduleCreate):
    db_schedule = models.VolunteerSchedule(**schedule.model_dump())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


def get_schedule(db: Session, schedule_id: int):
    return db.query(models.VolunteerSchedule).filter(models.VolunteerSchedule.id == schedule_id).first()


def get_schedules(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[schemas.ScheduleStatus] = None,
    volunteer_id: Optional[int] = None
):
    query = db.query(models.VolunteerSchedule)
    if status:
        query = query.filter(models.VolunteerSchedule.status == status)
    if volunteer_id:
        query = query.filter(models.VolunteerSchedule.volunteer_id == volunteer_id)
    return query.order_by(models.VolunteerSchedule.date.desc()).offset(skip).limit(limit).all()


def update_schedule(db: Session, schedule_id: int, schedule_update: schemas.VolunteerScheduleUpdate):
    db_schedule = get_schedule(db, schedule_id)
    if not db_schedule:
        return None
    for key, value in schedule_update.model_dump(exclude_unset=True).items():
        setattr(db_schedule, key, value)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


def get_schedule_feedbacks(db: Session, schedule_id: int):
    return db.query(models.Feedback).filter(
        models.Feedback.schedule_id == schedule_id
    ).order_by(models.Feedback.created_at.desc()).all()


def create_feedback(db: Session, feedback: schemas.FeedbackCreate):
    db_feedback = models.Feedback(**feedback.model_dump())
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


def get_feedback(db: Session, feedback_id: int):
    return db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()


def get_feedbacks(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[schemas.FeedbackStatus] = None,
    feedback_type: Optional[schemas.FeedbackType] = None,
    needs_review: Optional[bool] = None
):
    query = db.query(models.Feedback)
    if status:
        query = query.filter(models.Feedback.status == status)
    if feedback_type:
        query = query.filter(models.Feedback.feedback_type == feedback_type)
    if needs_review is not None:
        query = query.filter(models.Feedback.needs_review == needs_review)
    return query.order_by(models.Feedback.created_at.desc()).offset(skip).limit(limit).all()


def update_feedback(db: Session, feedback_id: int, feedback_update: schemas.FeedbackUpdate):
    db_feedback = get_feedback(db, feedback_id)
    if not db_feedback:
        return None
    
    update_data = feedback_update.model_dump(exclude_unset=True)
    if "response" in update_data and update_data["response"]:
        update_data["response_at"] = datetime.now()
    
    for key, value in update_data.items():
        setattr(db_feedback, key, value)
    
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


def create_review_trace(db: Session, trace: schemas.ReviewTraceCreate):
    db_trace = models.ReviewTrace(**trace.model_dump())
    db.add(db_trace)
    db.commit()
    db.refresh(db_trace)
    return db_trace


def get_feedback_traces(db: Session, feedback_id: int):
    return db.query(models.ReviewTrace).filter(
        models.ReviewTrace.feedback_id == feedback_id
    ).order_by(models.ReviewTrace.created_at.desc()).all()


def create_exhibit(db: Session, exhibit: schemas.ExhibitCreate):
    db_exhibit = models.Exhibit(**exhibit.model_dump())
    db.add(db_exhibit)
    db.commit()
    db.refresh(db_exhibit)
    return db_exhibit


def get_exhibit(db: Session, exhibit_id: int):
    return db.query(models.Exhibit).filter(models.Exhibit.id == exhibit_id).first()


def get_exhibits(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[schemas.ExhibitStatus] = None
):
    query = db.query(models.Exhibit)
    if status:
        query = query.filter(models.Exhibit.status == status)
    return query.order_by(models.Exhibit.created_at.desc()).offset(skip).limit(limit).all()


def create_exhibit_transfer(db: Session, transfer: schemas.ExhibitTransferCreate):
    db_transfer = models.ExhibitTransfer(**transfer.model_dump())
    db.add(db_transfer)
    
    db_exhibit = get_exhibit(db, transfer.exhibit_id)
    if db_exhibit:
        db_exhibit.location = transfer.to_location
        db_exhibit.status = models.ExhibitStatus.IN_TRANSIT
    
    db.commit()
    db.refresh(db_transfer)
    return db_transfer


def get_exhibit_transfers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    confirmed: Optional[bool] = None
):
    query = db.query(models.ExhibitTransfer)
    if confirmed is not None:
        query = query.filter(models.ExhibitTransfer.confirmed == confirmed)
    return query.order_by(models.ExhibitTransfer.created_at.desc()).offset(skip).limit(limit).all()


def confirm_exhibit_transfer(db: Session, transfer_id: int):
    db_transfer = db.query(models.ExhibitTransfer).filter(
        models.ExhibitTransfer.id == transfer_id
    ).first()
    if not db_transfer:
        return None
    
    db_transfer.confirmed = True
    db_transfer.confirmed_at = datetime.now()
    
    db_exhibit = get_exhibit(db, db_transfer.exhibit_id)
    if db_exhibit:
        db_exhibit.status = models.ExhibitStatus.ON_DISPLAY
    
    db.commit()
    db.refresh(db_transfer)
    return db_transfer


def create_activity(db: Session, activity: schemas.ActivityCreate):
    db_activity = models.Activity(**activity.model_dump())
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity


def get_activity(db: Session, activity_id: int):
    return db.query(models.Activity).filter(models.Activity.id == activity_id).first()


def get_activities(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[schemas.ActivityStatus] = None
):
    query = db.query(models.Activity)
    if status:
        query = query.filter(models.Activity.status == status)
    return query.order_by(models.Activity.start_time.desc()).offset(skip).limit(limit).all()


def update_activity(db: Session, activity_id: int, activity_update: schemas.ActivityUpdate):
    db_activity = get_activity(db, activity_id)
    if not db_activity:
        return None
    for key, value in activity_update.model_dump(exclude_unset=True).items():
        setattr(db_activity, key, value)
    db.commit()
    db.refresh(db_activity)
    return db_activity


def create_ticket(db: Session, ticket: schemas.TicketCreate):
    db_ticket = models.Ticket(**ticket.model_dump())
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


def get_tickets(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    activity_id: Optional[int] = None,
    verification_status: Optional[schemas.VerificationStatus] = None
):
    query = db.query(models.Ticket)
    if activity_id:
        query = query.filter(models.Ticket.activity_id == activity_id)
    if verification_status:
        query = query.filter(models.Ticket.verification_status == verification_status)
    return query.order_by(models.Ticket.created_at.desc()).offset(skip).limit(limit).all()


def verify_ticket(db: Session, ticket_id: int, verified_by: str):
    db_ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not db_ticket:
        return None
    
    db_ticket.verification_status = models.VerificationStatus.VERIFIED
    db_ticket.verified_at = datetime.now()
    db_ticket.verified_by = verified_by
    
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


def reject_ticket(db: Session, ticket_id: int, verified_by: str):
    db_ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not db_ticket:
        return None
    
    db_ticket.verification_status = models.VerificationStatus.REJECTED
    db_ticket.verified_at = datetime.now()
    db_ticket.verified_by = verified_by
    
    db.commit()
    db.refresh(db_ticket)
    return db_ticket
