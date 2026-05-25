from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import crud
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="图书发行管理系统 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="用户名已存在")
    return crud.create_user(db=db, user=user)


@app.get("/api/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.get_users(db, skip=skip, limit=limit)
    return users


@app.get("/api/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return db_user


@app.post("/api/books/", response_model=schemas.Book)
def create_book(book: schemas.BookCreate, db: Session = Depends(get_db)):
    return crud.create_book(db=db, book=book)


@app.get("/api/books/", response_model=List[schemas.Book])
def read_books(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    books = crud.get_books(db, skip=skip, limit=limit)
    return books


@app.post("/api/channels/", response_model=schemas.Channel)
def create_channel(channel: schemas.ChannelCreate, db: Session = Depends(get_db)):
    return crud.create_channel(db=db, channel=channel)


@app.get("/api/channels/", response_model=List[schemas.Channel])
def read_channels(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    channels = crud.get_channels(db, skip=skip, limit=limit)
    return channels


@app.post("/api/distributions/", response_model=schemas.Distribution)
def create_distribution(distribution: schemas.DistributionCreate, db: Session = Depends(get_db)):
    return crud.create_distribution(db=db, distribution=distribution)


@app.get("/api/distributions/", response_model=List[schemas.Distribution])
def read_distributions(skip: int = 0, limit: int = 100, status: str = None, db: Session = Depends(get_db)):
    distributions = crud.get_distributions(db, skip=skip, limit=limit, status=status)
    return distributions


@app.get("/api/distributions/{distribution_id}")
def read_distribution(distribution_id: int, db: Session = Depends(get_db)):
    db_distribution = crud.get_distribution(db, distribution_id=distribution_id)
    if db_distribution is None:
        raise HTTPException(status_code=404, detail="铺货单不存在")
    
    returns = db.query(models.Return).filter(
        models.Return.distribution_id == distribution_id
    ).all()
    
    payments = db.query(models.Payment).filter(
        models.Payment.distribution_id == distribution_id
    ).all()
    
    feedbacks = db.query(models.ChannelFeedback).filter(
        models.ChannelFeedback.distribution_id == distribution_id
    ).all()
    
    exceptions = db.query(models.ExceptionRecord).filter(
        models.ExceptionRecord.related_type == "distribution",
        models.ExceptionRecord.related_id == distribution_id
    ).all()
    
    def model_to_dict(obj):
        data = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
        return data
    
    distribution_data = model_to_dict(db_distribution)
    distribution_data['book'] = model_to_dict(db_distribution.book)
    distribution_data['channel'] = model_to_dict(db_distribution.channel)
    distribution_data['handler'] = model_to_dict(db_distribution.handler)
    distribution_data['channel_manager'] = model_to_dict(db_distribution.channel_manager)
    distribution_data['returns'] = [
        {**model_to_dict(r), 'distribution': None, 'handler': model_to_dict(r.handler)}
        for r in returns
    ]
    distribution_data['payments'] = [
        {**model_to_dict(p), 'distribution': None, 'channel': model_to_dict(p.channel), 'finance_confirm': model_to_dict(p.finance_confirm) if p.finance_confirm else None}
        for p in payments
    ]
    distribution_data['feedbacks'] = [model_to_dict(f) for f in feedbacks]
    distribution_data['exceptions'] = [
        {**model_to_dict(e), 'handler': model_to_dict(e.handler)}
        for e in exceptions
    ]
    
    return distribution_data


@app.put("/api/distributions/{distribution_id}", response_model=schemas.Distribution)
def update_distribution(distribution_id: int, distribution_update: schemas.DistributionUpdate, db: Session = Depends(get_db)):
    return crud.update_distribution(db, distribution_id, distribution_update)


@app.post("/api/returns/", response_model=schemas.Return)
def create_return(return_data: schemas.ReturnCreate, db: Session = Depends(get_db)):
    return crud.create_return(db=db, return_data=return_data)


@app.get("/api/returns/", response_model=List[schemas.Return])
def read_returns(skip: int = 0, limit: int = 100, status: str = None, db: Session = Depends(get_db)):
    returns = crud.get_returns(db, skip=skip, limit=limit, status=status)
    return returns


@app.get("/api/returns/{return_id}", response_model=schemas.Return)
def read_return(return_id: int, db: Session = Depends(get_db)):
    db_return = crud.get_return(db, return_id=return_id)
    if db_return is None:
        raise HTTPException(status_code=404, detail="退货单不存在")
    return db_return


@app.put("/api/returns/{return_id}", response_model=schemas.Return)
def update_return(return_id: int, return_update: schemas.ReturnUpdate, db: Session = Depends(get_db)):
    return crud.update_return(db, return_id, return_update)


@app.post("/api/payments/", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    return crud.create_payment(db=db, payment=payment)


@app.get("/api/payments/", response_model=List[schemas.Payment])
def read_payments(skip: int = 0, limit: int = 100, status: str = None, db: Session = Depends(get_db)):
    payments = crud.get_payments(db, skip=skip, limit=limit, status=status)
    return payments


@app.get("/api/payments/{payment_id}", response_model=schemas.Payment)
def read_payment(payment_id: int, db: Session = Depends(get_db)):
    db_payment = crud.get_payment(db, payment_id=payment_id)
    if db_payment is None:
        raise HTTPException(status_code=404, detail="回款记录不存在")
    return db_payment


@app.put("/api/payments/{payment_id}", response_model=schemas.Payment)
def update_payment(payment_id: int, payment_update: schemas.PaymentUpdate, db: Session = Depends(get_db)):
    return crud.update_payment(db, payment_id, payment_update)


@app.post("/api/exceptions/", response_model=schemas.ExceptionRecord)
def create_exception(exception: schemas.ExceptionRecordCreate, db: Session = Depends(get_db)):
    return crud.create_exception(db=db, exception=exception)


@app.get("/api/exceptions/", response_model=List[schemas.ExceptionRecord])
def read_exceptions(skip: int = 0, limit: int = 100, status: str = None, db: Session = Depends(get_db)):
    exceptions = crud.get_exceptions(db, skip=skip, limit=limit, status=status)
    return exceptions


@app.get("/api/exceptions/{exception_id}", response_model=schemas.ExceptionRecord)
def read_exception(exception_id: int, db: Session = Depends(get_db)):
    db_exception = crud.get_exception(db, exception_id=exception_id)
    if db_exception is None:
        raise HTTPException(status_code=404, detail="异常记录不存在")
    return db_exception


@app.put("/api/exceptions/{exception_id}", response_model=schemas.ExceptionRecord)
def update_exception(exception_id: int, exception_update: schemas.ExceptionRecordUpdate, db: Session = Depends(get_db)):
    return crud.update_exception(db, exception_id, exception_update)


@app.post("/api/feedbacks/", response_model=schemas.ChannelFeedback)
def create_feedback(feedback: schemas.ChannelFeedbackCreate, db: Session = Depends(get_db)):
    return crud.create_feedback(db=db, feedback=feedback)


@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)
