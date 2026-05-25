from sqlalchemy.orm import Session
from sqlalchemy import func
import models
import schemas
from datetime import datetime, date


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_books(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Book).offset(skip).limit(limit).all()


def create_book(db: Session, book: schemas.BookCreate):
    db_book = models.Book(**book.model_dump())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book


def get_channels(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Channel).offset(skip).limit(limit).all()


def create_channel(db: Session, channel: schemas.ChannelCreate):
    db_channel = models.Channel(**channel.model_dump())
    db.add(db_channel)
    db.commit()
    db.refresh(db_channel)
    return db_channel


def generate_distribution_no(db: Session):
    today = date.today().strftime("%Y%m%d")
    prefix = f"PU{today}"
    last = db.query(models.Distribution).filter(
        models.Distribution.distribution_no.like(f"{prefix}%")
    ).order_by(models.Distribution.distribution_no.desc()).first()
    if last:
        seq = int(last.distribution_no[-4:]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def get_distributions(db: Session, skip: int = 0, limit: int = 100, status: str = None):
    query = db.query(models.Distribution)
    if status:
        query = query.filter(models.Distribution.status == status)
    return query.order_by(models.Distribution.created_at.desc()).offset(skip).limit(limit).all()


def get_distribution(db: Session, distribution_id: int):
    return db.query(models.Distribution).filter(models.Distribution.id == distribution_id).first()


def create_distribution(db: Session, distribution: schemas.DistributionCreate):
    distribution_no = generate_distribution_no(db)
    db_distribution = models.Distribution(
        **distribution.model_dump(),
        distribution_no=distribution_no,
        status="shipped",
        receipt_status="pending"
    )
    db.add(db_distribution)
    db.commit()
    db.refresh(db_distribution)
    return db_distribution


def update_distribution(db: Session, distribution_id: int, distribution_update: schemas.DistributionUpdate):
    db_distribution = get_distribution(db, distribution_id)
    if db_distribution:
        for key, value in distribution_update.model_dump(exclude_unset=True).items():
            setattr(db_distribution, key, value)
        db.commit()
        db.refresh(db_distribution)
    return db_distribution


def generate_return_no(db: Session):
    today = date.today().strftime("%Y%m%d")
    prefix = f"RT{today}"
    last = db.query(models.Return).filter(
        models.Return.return_no.like(f"{prefix}%")
    ).order_by(models.Return.return_no.desc()).first()
    if last:
        seq = int(last.return_no[-4:]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def get_returns(db: Session, skip: int = 0, limit: int = 100, status: str = None):
    query = db.query(models.Return)
    if status:
        query = query.filter(models.Return.status == status)
    return query.order_by(models.Return.created_at.desc()).offset(skip).limit(limit).all()


def get_return(db: Session, return_id: int):
    return db.query(models.Return).filter(models.Return.id == return_id).first()


def create_return(db: Session, return_data: schemas.ReturnCreate):
    return_no = generate_return_no(db)
    db_return = models.Return(
        **return_data.model_dump(),
        return_no=return_no,
        status="pending",
        receive_status="pending"
    )
    db.add(db_return)
    db.commit()
    db.refresh(db_return)
    
    distribution = get_distribution(db, return_data.distribution_id)
    if distribution:
        if distribution.status != "returned":
            distribution.status = "returned"
            db.commit()
    
    return db_return


def update_return(db: Session, return_id: int, return_update: schemas.ReturnUpdate):
    db_return = get_return(db, return_id)
    if db_return:
        for key, value in return_update.model_dump(exclude_unset=True).items():
            setattr(db_return, key, value)
        db.commit()
        db.refresh(db_return)
    return db_return


def generate_payment_no(db: Session):
    today = date.today().strftime("%Y%m%d")
    prefix = f"PY{today}"
    last = db.query(models.Payment).filter(
        models.Payment.payment_no.like(f"{prefix}%")
    ).order_by(models.Payment.payment_no.desc()).first()
    if last:
        seq = int(last.payment_no[-4:]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def get_payments(db: Session, skip: int = 0, limit: int = 100, status: str = None):
    query = db.query(models.Payment)
    if status:
        query = query.filter(models.Payment.status == status)
    return query.order_by(models.Payment.created_at.desc()).offset(skip).limit(limit).all()


def get_payment(db: Session, payment_id: int):
    return db.query(models.Payment).filter(models.Payment.id == payment_id).first()


def create_payment(db: Session, payment: schemas.PaymentCreate):
    payment_no = generate_payment_no(db)
    db_payment = models.Payment(
        **payment.model_dump(),
        payment_no=payment_no,
        status="pending"
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment


def update_payment(db: Session, payment_id: int, payment_update: schemas.PaymentUpdate):
    db_payment = get_payment(db, payment_id)
    if db_payment:
        for key, value in payment_update.model_dump(exclude_unset=True).items():
            setattr(db_payment, key, value)
        db.commit()
        db.refresh(db_payment)
    return db_payment


def get_exceptions(db: Session, skip: int = 0, limit: int = 100, status: str = None):
    query = db.query(models.ExceptionRecord)
    if status:
        query = query.filter(models.ExceptionRecord.status == status)
    return query.order_by(models.ExceptionRecord.created_at.desc()).offset(skip).limit(limit).all()


def get_exception(db: Session, exception_id: int):
    return db.query(models.ExceptionRecord).filter(models.ExceptionRecord.id == exception_id).first()


def create_exception(db: Session, exception: schemas.ExceptionRecordCreate):
    db_exception = models.ExceptionRecord(**exception.model_dump())
    db.add(db_exception)
    db.commit()
    db.refresh(db_exception)
    return db_exception


def update_exception(db: Session, exception_id: int, exception_update: schemas.ExceptionRecordUpdate):
    db_exception = get_exception(db, exception_id)
    if db_exception:
        for key, value in exception_update.model_dump(exclude_unset=True).items():
            setattr(db_exception, key, value)
        if exception_update.status == "resolved":
            db_exception.resolved_at = datetime.now()
        db.commit()
        db.refresh(db_exception)
    return db_exception


def get_feedbacks_by_distribution(db: Session, distribution_id: int):
    return db.query(models.ChannelFeedback).filter(
        models.ChannelFeedback.distribution_id == distribution_id
    ).all()


def create_feedback(db: Session, feedback: schemas.ChannelFeedbackCreate):
    db_feedback = models.ChannelFeedback(**feedback.model_dump())
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


def get_dashboard_stats(db: Session):
    total_distributions = db.query(func.count(models.Distribution.id)).scalar()
    pending_receipt = db.query(func.count(models.Distribution.id)).filter(
        models.Distribution.receipt_status == "pending"
    ).scalar()
    pending_return = db.query(func.count(models.Return.id)).filter(
        models.Return.status == "pending"
    ).scalar()
    pending_payment = db.query(func.count(models.Payment.id)).filter(
        models.Payment.status == "pending"
    ).scalar()
    exception_count = db.query(func.count(models.ExceptionRecord.id)).filter(
        models.ExceptionRecord.status == "open"
    ).scalar()
    
    total_payment_amount = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.status == "confirmed"
    ).scalar() or 0
    
    total_return_amount = db.query(
        func.sum(models.Return.quantity * models.Book.price)
    ).join(models.Distribution).join(models.Book).filter(
        models.Return.status == "completed"
    ).scalar() or 0
    
    total_distribution_amount = db.query(
        func.sum(models.Distribution.quantity * models.Book.price)
    ).join(models.Book).scalar() or 0
    
    total_sales_amount = total_distribution_amount - total_return_amount
    
    return schemas.DashboardStats(
        total_distributions=total_distributions,
        pending_receipt=pending_receipt,
        pending_return=pending_return,
        pending_payment=pending_payment,
        exception_count=exception_count,
        total_sales_amount=total_sales_amount,
        total_return_amount=total_return_amount,
        total_payment_amount=total_payment_amount
    )
