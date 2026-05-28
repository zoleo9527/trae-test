from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import List, Optional
import uuid

from . import models, schemas
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="桶装水配送管理系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def generate_order_no():
    return f"WD{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4].upper()}"


@app.get("/")
def read_root():
    return {"message": "桶装水配送管理系统 API"}


@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()
    start_of_month = today.replace(day=1)

    pending_orders = db.query(models.Order).filter(models.Order.status == "pending").count()
    rejected_orders = db.query(models.Order).filter(models.Order.status == "rejected").count()
    review_needed = db.query(models.Order).filter(models.Order.status == "review").count()
    pending_exceptions = db.query(models.OrderException).filter(models.OrderException.status == "pending").count()
    pending_reminders = db.query(models.PaymentReminder).filter(models.PaymentReminder.status == "pending").count()
    total_customers = db.query(models.Customer).count()
    today_deliveries = db.query(models.Order).filter(
        models.Order.delivery_date >= datetime.combine(today, datetime.min.time()),
        models.Order.delivery_date < datetime.combine(today + timedelta(days=1), datetime.min.time())
    ).count()
    monthly_revenue = db.query(models.Payment).filter(
        models.Payment.payment_date >= datetime.combine(start_of_month, datetime.min.time())
    ).with_entities(models.Payment.amount).all()
    total_revenue = sum(r[0] for r in monthly_revenue) if monthly_revenue else 0

    return {
        "pending_orders": pending_orders,
        "rejected_orders": rejected_orders,
        "review_needed": review_needed,
        "pending_exceptions": pending_exceptions,
        "pending_reminders": pending_reminders,
        "total_customers": total_customers,
        "today_deliveries": today_deliveries,
        "monthly_revenue": total_revenue
    }


@app.get("/api/customers", response_model=List[schemas.Customer])
def get_customers(
    skip: int = 0,
    limit: int = 100,
    type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Customer)
    if type:
        query = query.filter(models.Customer.type == type)
    if status:
        query = query.filter(models.Customer.status == status)
    return query.offset(skip).limit(limit).all()


@app.get("/api/customers/{customer_id}", response_model=schemas.Customer)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    return customer


@app.post("/api/customers", response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)

    db_log = models.OperationLog(
        customer_id=db_customer.id,
        operator="system",
        action="创建客户",
        new_value=f"客户名称: {db_customer.name}"
    )
    db.add(db_log)
    db.commit()

    return db_customer


@app.put("/api/customers/{customer_id}", response_model=schemas.Customer)
def update_customer(customer_id: int, customer_update: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="客户不存在")

    old_value = f"名称: {db_customer.name}, 电话: {db_customer.phone}"

    for key, value in customer_update.model_dump(exclude_unset=True).items():
        setattr(db_customer, key, value)

    db.commit()
    db.refresh(db_customer)

    new_value = f"名称: {db_customer.name}, 电话: {db_customer.phone}"
    db_log = models.OperationLog(
        customer_id=db_customer.id,
        operator="system",
        action="更新客户信息",
        old_value=old_value,
        new_value=new_value
    )
    db.add(db_log)
    db.commit()

    return db_customer


@app.get("/api/orders", response_model=List[schemas.Order])
def get_orders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Order).join(models.Customer)
    if status:
        query = query.filter(models.Order.status == status)
    if customer_id:
        query = query.filter(models.Order.customer_id == customer_id)
    return query.order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()


@app.get("/api/orders/{order_id}", response_model=schemas.Order)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@app.post("/api/orders", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    db_order = models.Order(
        **order.model_dump(),
        order_no=generate_order_no()
    )
    db.add(db_order)
    db.flush()

    if order.buckets_delivered > 0:
        customer = db.query(models.Customer).filter(models.Customer.id == order.customer_id).first()
        if customer:
            customer.current_debt += order.buckets_delivered * customer.price_per_bucket
            customer.balance_buckets += order.buckets_delivered

    if order.buckets_returned > 0:
        customer = db.query(models.Customer).filter(models.Customer.id == order.customer_id).first()
        if customer:
            customer.balance_buckets -= order.buckets_returned

    db.commit()
    db.refresh(db_order)

    db_log = models.OperationLog(
        order_id=db_order.id,
        customer_id=order.customer_id,
        operator="system",
        action="创建订单",
        new_value=f"订单号: {db_order.order_no}, 送水: {order.buckets_delivered}桶, 回桶: {order.buckets_returned}桶"
    )
    db.add(db_log)
    db.commit()

    return db_order


@app.put("/api/orders/{order_id}", response_model=schemas.Order)
def update_order(order_id: int, order_update: schemas.OrderUpdate, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="订单不存在")

    old_value = f"状态: {db_order.status}, 送水: {db_order.buckets_delivered}桶"

    for key, value in order_update.model_dump(exclude_unset=True).items():
        setattr(db_order, key, value)

    db.commit()
    db.refresh(db_order)

    new_value = f"状态: {db_order.status}, 送水: {db_order.buckets_delivered}桶"
    db_log = models.OperationLog(
        order_id=db_order.id,
        customer_id=db_order.customer_id,
        operator="system",
        action="更新订单",
        old_value=old_value,
        new_value=new_value
    )
    db.add(db_log)
    db.commit()

    return db_order


@app.post("/api/payments", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    db_payment = models.Payment(**payment.model_dump())
    db.add(db_payment)
    db.flush()

    customer = db.query(models.Customer).filter(models.Customer.id == payment.customer_id).first()
    if customer:
        customer.current_debt -= payment.amount

    db.commit()
    db.refresh(db_payment)

    db_log = models.OperationLog(
        customer_id=payment.customer_id,
        operator=payment.operator or "system",
        action="收款登记",
        new_value=f"金额: {payment.amount}元, 方式: {payment.payment_method}"
    )
    db.add(db_log)
    db.commit()

    return db_payment


@app.get("/api/payments", response_model=List[schemas.Payment])
def get_payments(
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Payment)
    if customer_id:
        query = query.filter(models.Payment.customer_id == customer_id)
    return query.order_by(models.Payment.created_at.desc()).offset(skip).limit(limit).all()


@app.get("/api/payment-reminders", response_model=List[schemas.PaymentReminder])
def get_payment_reminders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.PaymentReminder).join(models.Customer)
    if status:
        query = query.filter(models.PaymentReminder.status == status)
    if customer_id:
        query = query.filter(models.PaymentReminder.customer_id == customer_id)
    return query.order_by(models.PaymentReminder.due_date.asc()).offset(skip).limit(limit).all()


@app.post("/api/payment-reminders", response_model=schemas.PaymentReminder)
def create_payment_reminder(reminder: schemas.PaymentReminderCreate, db: Session = Depends(get_db)):
    db_reminder = models.PaymentReminder(**reminder.model_dump())
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder


@app.put("/api/payment-reminders/{reminder_id}", response_model=schemas.PaymentReminder)
def update_payment_reminder(
    reminder_id: int,
    reminder_update: schemas.PaymentReminderUpdate,
    db: Session = Depends(get_db)
):
    db_reminder = db.query(models.PaymentReminder).filter(models.PaymentReminder.id == reminder_id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="回款提醒不存在")

    for key, value in reminder_update.model_dump(exclude_unset=True).items():
        setattr(db_reminder, key, value)

    db.commit()
    db.refresh(db_reminder)
    return db_reminder


@app.get("/api/exceptions", response_model=List[schemas.OrderException])
def get_exceptions(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.OrderException).join(models.Order)
    if status:
        query = query.filter(models.OrderException.status == status)
    if type:
        query = query.filter(models.OrderException.type == type)
    return query.order_by(models.OrderException.created_at.desc()).offset(skip).limit(limit).all()


@app.post("/api/exceptions", response_model=schemas.OrderException)
def create_exception(exception: schemas.OrderExceptionCreate, db: Session = Depends(get_db)):
    db_exception = models.OrderException(**exception.model_dump())
    db.add(db_exception)
    db.commit()
    db.refresh(db_exception)
    return db_exception


@app.put("/api/exceptions/{exception_id}", response_model=schemas.OrderException)
def update_exception(
    exception_id: int,
    exception_update: schemas.OrderExceptionUpdate,
    db: Session = Depends(get_db)
):
    db_exception = db.query(models.OrderException).filter(models.OrderException.id == exception_id).first()
    if not db_exception:
        raise HTTPException(status_code=404, detail="异常记录不存在")

    for key, value in exception_update.model_dump(exclude_unset=True).items():
        setattr(db_exception, key, value)

    db.commit()
    db.refresh(db_exception)
    return db_exception


@app.get("/api/logs", response_model=List[schemas.OperationLog])
def get_logs(
    skip: int = 0,
    limit: int = 100,
    order_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.OperationLog)
    if order_id:
        query = query.filter(models.OperationLog.order_id == order_id)
    if customer_id:
        query = query.filter(models.OperationLog.customer_id == customer_id)
    return query.order_by(models.OperationLog.created_at.desc()).offset(skip).limit(limit).all()
