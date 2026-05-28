from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from .database import SessionLocal, engine
from . import models

models.Base.metadata.create_all(bind=engine)


def init_data():
    db = SessionLocal()

    customers = [
        {"name": "张三科技有限公司", "phone": "13800138001", "address": "科技园区A座101", "type": "monthly", "price_per_bucket": 18.0, "balance_buckets": 5, "credit_limit": 5000, "current_debt": 1260},
        {"name": "李四餐饮管理公司", "phone": "13800138002", "address": "商业街88号", "type": "monthly", "price_per_bucket": 20.0, "balance_buckets": 12, "credit_limit": 3000, "current_debt": 840},
        {"name": "王五教育培训中心", "phone": "13800138003", "address": "教育路56号", "type": "monthly", "price_per_bucket": 19.0, "balance_buckets": 8, "credit_limit": 2000, "current_debt": 456},
        {"name": "赵六医疗诊所", "phone": "13800138004", "address": "健康大道120号", "type": "monthly", "price_per_bucket": 22.0, "balance_buckets": 3, "credit_limit": 4000, "current_debt": 660},
        {"name": "孙七物流公司", "phone": "13800138005", "address": "物流园区B区", "type": "monthly", "price_per_bucket": 17.0, "balance_buckets": 15, "credit_limit": 6000, "current_debt": 2040},
    ]

    for c in customers:
        customer = models.Customer(**c)
        db.add(customer)

    db.flush()

    orders = [
        {"customer_id": 1, "order_no": "WD20260520090001A1B2", "buckets_delivered": 10, "buckets_returned": 8, "delivery_route": "A线", "delivery_person": "陈师傅", "status": "completed", "delivery_date": datetime.now() - timedelta(days=8), "remark": "正常配送"},
        {"customer_id": 2, "order_no": "WD20260521100002C3D4", "buckets_delivered": 8, "buckets_returned": 10, "delivery_route": "B线", "delivery_person": "刘师傅", "status": "completed", "delivery_date": datetime.now() - timedelta(days=7), "remark": "回桶多2个"},
        {"customer_id": 3, "order_no": "WD20260522140003E5F6", "buckets_delivered": 5, "buckets_returned": 0, "delivery_route": "A线", "delivery_person": "陈师傅", "status": "pending", "delivery_date": datetime.now(), "remark": "待配送"},
        {"customer_id": 4, "order_no": "WD20260523110004G7H8", "buckets_delivered": 6, "buckets_returned": 5, "delivery_route": "C线", "delivery_person": "王师傅", "status": "review", "delivery_date": datetime.now() - timedelta(days=5), "remark": "回桶数量有争议，客户说回了6个"},
        {"customer_id": 5, "order_no": "WD20260524080005I9J0", "buckets_delivered": 15, "buckets_returned": 12, "delivery_route": "B线", "delivery_person": "刘师傅", "status": "rejected", "delivery_date": datetime.now() - timedelta(days=4), "remark": "签收照片模糊，被驳回"},
        {"customer_id": 1, "order_no": "WD20260525130006K1L2", "buckets_delivered": 12, "buckets_returned": 10, "delivery_route": "A线", "delivery_person": "陈师傅", "status": "pending", "delivery_date": datetime.now(), "remark": "今天上午配送"},
        {"customer_id": 3, "order_no": "WD20260526090007M3N4", "buckets_delivered": 7, "buckets_returned": 7, "delivery_route": "A线", "delivery_person": "陈师傅", "status": "completed", "delivery_date": datetime.now() - timedelta(days=2), "remark": "正常"},
    ]

    for o in orders:
        order = models.Order(**o)
        db.add(order)

    db.flush()

    payments = [
        {"customer_id": 1, "amount": 2000, "payment_method": "银行转账", "payment_date": datetime.now() - timedelta(days=10), "operator": "财务小李", "remark": "5月部分回款"},
        {"customer_id": 2, "amount": 1000, "payment_method": "微信", "payment_date": datetime.now() - timedelta(days=5), "operator": "财务小李", "remark": "微信转账"},
        {"customer_id": 5, "amount": 1500, "payment_method": "现金", "payment_date": datetime.now() - timedelta(days=3), "operator": "财务小张", "remark": "现金收款"},
    ]

    for p in payments:
        payment = models.Payment(**p)
        db.add(payment)

    reminders = [
        {"customer_id": 1, "amount_due": 1260, "due_date": datetime.now() + timedelta(days=5), "status": "pending", "reminder_count": 1, "remark": "本月账单"},
        {"customer_id": 2, "amount_due": 840, "due_date": datetime.now() + timedelta(days=3), "status": "pending", "reminder_count": 2, "remark": "请尽快安排付款"},
        {"customer_id": 3, "amount_due": 456, "due_date": datetime.now() + timedelta(days=10), "status": "pending", "reminder_count": 0, "remark": "新账单"},
        {"customer_id": 4, "amount_due": 660, "due_date": datetime.now() + timedelta(days=1), "status": "pending", "reminder_count": 3, "remark": "已逾期预警"},
        {"customer_id": 5, "amount_due": 2040, "due_date": datetime.now() + timedelta(days=7), "status": "completed", "reminder_count": 1, "remark": "已回款"},
    ]

    for r in reminders:
        reminder = models.PaymentReminder(**r)
        db.add(reminder)

    exceptions = [
        {"order_id": 4, "type": "bucket_dispute", "description": "客户称回桶6个，但系统记录为5个，存在1个空桶差异", "status": "pending", "reported_by": "刘师傅"},
        {"order_id": 5, "type": "photo_issue", "description": "签收照片模糊不清，无法辨认", "status": "pending", "reported_by": "质检小王"},
        {"order_id": 2, "type": "complaint", "description": "客户投诉送水迟到2小时，要求补偿", "status": "resolved", "reported_by": "客服小丽", "handled_by": "客服主管", "handled_at": datetime.now() - timedelta(days=6), "handle_result": "已赠送1桶水作为补偿，客户满意"},
    ]

    for e in exceptions:
        exception = models.OrderException(**e)
        db.add(exception)

    db.commit()
    db.close()
    print("初始化数据完成！")


if __name__ == "__main__":
    init_data()
