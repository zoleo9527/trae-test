from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import List, Optional
import uuid
import os
import shutil

from . import models, schemas
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="桶装水配送管理系统")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def generate_order_no():
    return f"WD{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4].upper()}"


def auto_create_or_update_reminder(db: Session, customer_id: int, operator: str = "system"):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer or customer.current_debt <= 0:
        return
    
    pending_reminder = db.query(models.PaymentReminder).filter(
        models.PaymentReminder.customer_id == customer_id,
        models.PaymentReminder.status == "pending"
    ).first()
    
    if pending_reminder:
        old_amount = pending_reminder.amount_due
        pending_reminder.amount_due = customer.current_debt
        db.add(models.OperationLog(
            customer_id=customer_id,
            operator=operator,
            action="更新回款提醒",
            old_value=f"原提醒金额: {old_amount}元",
            new_value=f"新提醒金额: {customer.current_debt}元"
        ))
    else:
        due_date = date.today() + timedelta(days=30)
        new_reminder = models.PaymentReminder(
            customer_id=customer_id,
            amount_due=customer.current_debt,
            due_date=due_date,
            status="pending",
            remark="系统自动生成"
        )
        db.add(new_reminder)
        db.add(models.OperationLog(
            customer_id=customer_id,
            operator=operator,
            action="生成回款提醒",
            new_value=f"提醒金额: {customer.current_debt}元, 到期日: {due_date}"
        ))


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
    db.flush()

    db_log = models.OperationLog(
        customer_id=db_customer.id,
        operator="system",
        action="创建客户",
        new_value=f"客户名称: {db_customer.name}"
    )
    db.add(db_log)

    if db_customer.current_debt > 0:
        auto_create_or_update_reminder(db, db_customer.id)

    db.commit()
    db.refresh(db_customer)

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

    customer = db.query(models.Customer).filter(models.Customer.id == order.customer_id).first()
    if customer:
        if order.buckets_delivered > 0:
            customer.current_debt += order.buckets_delivered * customer.price_per_bucket
            customer.balance_buckets += order.buckets_delivered

        if order.buckets_returned > 0:
            customer.balance_buckets -= order.buckets_returned

    db_log = models.OperationLog(
        order_id=db_order.id,
        customer_id=order.customer_id,
        operator="system",
        action="创建订单",
        new_value=f"订单号: {db_order.order_no}, 送水: {order.buckets_delivered}桶, 回桶: {order.buckets_returned}桶"
    )
    db.add(db_log)

    if customer and order.buckets_delivered > 0:
        auto_create_or_update_reminder(db, order.customer_id)

    db.commit()
    db.refresh(db_order)

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
        old_debt = customer.current_debt
        customer.current_debt -= payment.amount

        db_log = models.OperationLog(
            customer_id=payment.customer_id,
            operator=payment.operator or "system",
            action="收款登记",
            old_value=f"原欠款: {old_debt}元",
            new_value=f"收款: {payment.amount}元, 方式: {payment.payment_method}, 剩余欠款: {customer.current_debt}元"
        )
        db.add(db_log)

        pending_reminder = db.query(models.PaymentReminder).filter(
            models.PaymentReminder.customer_id == payment.customer_id,
            models.PaymentReminder.status == "pending"
        ).first()

        if pending_reminder:
            if customer.current_debt <= 0:
                pending_reminder.status = "completed"
                db.add(models.OperationLog(
                    customer_id=payment.customer_id,
                    operator=payment.operator or "system",
                    action="回款提醒完成",
                    old_value=f"待回款金额: {pending_reminder.amount_due}元",
                    new_value="已全部回款，提醒标记为完成"
                ))
            else:
                pending_reminder.amount_due = customer.current_debt
                db.add(models.OperationLog(
                    customer_id=payment.customer_id,
                    operator=payment.operator or "system",
                    action="更新回款提醒金额",
                    old_value=f"原提醒金额: {pending_reminder.amount_due + payment.amount}元",
                    new_value=f"新提醒金额: {customer.current_debt}元"
                ))

    db.commit()
    db.refresh(db_payment)

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
    db.flush()

    db_log = models.OperationLog(
        customer_id=reminder.customer_id,
        operator="system",
        action="创建回款提醒",
        new_value=f"提醒金额: {reminder.amount_due}元, 到期日: {reminder.due_date}"
    )
    db.add(db_log)

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

    old_status = db_reminder.status
    old_value = f"状态: {old_status}, 金额: {db_reminder.amount_due}元, 提醒次数: {db_reminder.reminder_count}"

    for key, value in reminder_update.model_dump(exclude_unset=True).items():
        setattr(db_reminder, key, value)

    action = "更新回款提醒"
    if reminder_update.status == "completed" and old_status != "completed":
        action = "标记回款提醒完成"
    elif reminder_update.reminder_count is not None and reminder_update.reminder_count > db_reminder.reminder_count - 1:
        action = "发送回款提醒"

    new_value = f"状态: {db_reminder.status}, 金额: {db_reminder.amount_due}元, 提醒次数: {db_reminder.reminder_count}"
    db_log = models.OperationLog(
        customer_id=db_reminder.customer_id,
        operator="system",
        action=action,
        old_value=old_value,
        new_value=new_value
    )
    db.add(db_log)

    db.commit()
    db.refresh(db_reminder)
    return db_reminder


@app.post("/api/payment-reminders/{reminder_id}/mark-paid")
def mark_reminder_paid(
    reminder_id: int,
    db: Session = Depends(get_db)
):
    db_reminder = db.query(models.PaymentReminder).filter(models.PaymentReminder.id == reminder_id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="回款提醒不存在")

    customer = db.query(models.Customer).filter(models.Customer.id == db_reminder.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")

    old_debt = customer.current_debt
    old_reminder_status = db_reminder.status

    db_payment = models.Payment(
        customer_id=db_reminder.customer_id,
        amount=db_reminder.amount_due,
        payment_method="银行转账",
        payment_date=datetime.now(),
        operator="管理员"
    )
    db.add(db_payment)

    customer.current_debt -= db_reminder.amount_due
    db_reminder.status = "completed"

    db.add(models.OperationLog(
        customer_id=db_reminder.customer_id,
        operator="管理员",
        action="标记已回款并登记收款",
        old_value=f"原欠款: {old_debt}元, 提醒状态: {old_reminder_status}",
        new_value=f"收款: {db_reminder.amount_due}元, 剩余欠款: {customer.current_debt}元, 提醒已完成"
    ))

    db.commit()
    db.refresh(db_reminder)

    return {"message": "标记成功", "reminder": db_reminder}


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
    db.flush()

    type_map = {
        'bucket_dispute': '空桶争议',
        'photo_issue': '照片问题',
        'complaint': '客户投诉',
        'delivery_delay': '配送延迟'
    }
    type_label = type_map.get(exception.type, exception.type)

    db_log = models.OperationLog(
        order_id=exception.order_id,
        operator="system",
        action=f"上报异常: {type_label}",
        new_value=exception.description
    )
    db.add(db_log)

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

    old_status = db_exception.status
    old_value = f"状态: {old_status}"

    for key, value in exception_update.model_dump(exclude_unset=True).items():
        setattr(db_exception, key, value)

    type_map = {
        'bucket_dispute': '空桶争议',
        'photo_issue': '照片问题',
        'complaint': '客户投诉',
        'delivery_delay': '配送延迟'
    }
    type_label = type_map.get(db_exception.type, db_exception.type)

    action = f"处理异常: {type_label}"
    if exception_update.status == "resolved" and old_status != "resolved":
        action = f"解决异常: {type_label}"

    new_value = f"状态: {db_exception.status}"
    if exception_update.handler_note:
        new_value += f", 处理备注: {exception_update.handler_note}"

    db_log = models.OperationLog(
        order_id=db_exception.order_id,
        operator=exception_update.handled_by or "system",
        action=action,
        old_value=old_value,
        new_value=new_value
    )
    db.add(db_log)

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


@app.post("/api/orders/{order_id}/upload-photo")
async def upload_photo(
    order_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="订单不存在")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
        raise HTTPException(status_code=400, detail="只支持图片文件")

    file_name = f"order_{order_id}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    photo_url = f"/uploads/{file_name}"
    db_order.sign_photo_url = photo_url
    db_order.status = "completed"

    db_log = models.OperationLog(
        order_id=order_id,
        customer_id=db_order.customer_id,
        operator="system",
        action="上传签收照片",
        new_value=f"照片URL: {photo_url}"
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_order)

    return {"message": "上传成功", "photo_url": photo_url, "order": db_order}
