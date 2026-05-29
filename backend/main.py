from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import uuid
import random

app = FastAPI(title="跑腿平台-商家结算与异常补贴 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OrderStatus:
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ABNORMAL = "abnormal"

class AppealStatus:
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEED_REVIEW = "need_review"

class SubsidyType:
    OVERTIME = "overtime"
    WEATHER = "weather"
    DISTANCE = "distance"
    WEIGHT = "weight"
    OTHER = "other"

class Merchant(BaseModel):
    id: str
    name: str
    phone: str
    address: str
    rating: float
    total_orders: int
    balance: float

class Order(BaseModel):
    id: str
    merchant_id: str
    merchant_name: str
    order_no: str
    customer_name: str
    customer_phone: str
    delivery_address: str
    goods_desc: str
    goods_amount: float
    delivery_fee: float
    total_amount: float
    status: str
    created_at: datetime
    expected_delivery_time: datetime
    actual_delivery_time: Optional[datetime] = None
    is_abnormal: bool = False
    abnormal_reason: Optional[str] = None
    abnormal_time: Optional[datetime] = None

class Appeal(BaseModel):
    id: str
    order_id: str
    order_no: str
    merchant_id: str
    merchant_name: str
    type: str
    reason: str
    description: str
    screenshot_urls: List[str]
    status: str
    created_at: datetime
    processed_at: Optional[datetime] = None
    processor: Optional[str] = None
    process_note: Optional[str] = None
    subsidy_amount: Optional[float] = None

class Subsidy(BaseModel):
    id: str
    order_id: str
    order_no: str
    merchant_id: str
    merchant_name: str
    appeal_id: Optional[str] = None
    type: str
    amount: float
    reason: str
    description: str
    created_at: datetime
    created_by: str
    is_settled: bool = False
    settled_at: Optional[datetime] = None

class Settlement(BaseModel):
    id: str
    merchant_id: str
    merchant_name: str
    period_start: datetime
    period_end: datetime
    total_orders: int
    total_goods_amount: float
    total_delivery_fee: float
    total_subsidy: float
    total_deduction: float
    net_amount: float
    status: str
    created_at: datetime
    settled_at: Optional[datetime] = None

class OperationLog(BaseModel):
    id: str
    order_id: Optional[str] = None
    appeal_id: Optional[str] = None
    action: str
    operator: str
    operator_role: str
    description: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime

merchants_db: Dict[str, Merchant] = {}
orders_db: Dict[str, Order] = {}
appeals_db: Dict[str, Appeal] = {}
subsidies_db: Dict[str, Subsidy] = {}
settlements_db: Dict[str, Settlement] = {}
operation_logs_db: Dict[str, OperationLog] = {}

def init_mock_data():
    merchant_names = ["美味快餐", "好再来餐厅", "鲜果时光", "麻辣香锅", "甜品小屋"]
    for i, name in enumerate(merchant_names):
        merchant_id = f"m{i+1:03d}"
        merchants_db[merchant_id] = Merchant(
            id=merchant_id,
            name=name,
            phone=f"138{random.randint(10000000, 99999999)}",
            address=f"北京市朝阳区某某路{i+1}号",
            rating=round(random.uniform(4.0, 5.0), 1),
            total_orders=random.randint(100, 1000),
            balance=round(random.uniform(1000, 10000), 2)
        )

    order_statuses = [OrderStatus.PENDING, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.ABNORMAL]
    for i in range(50):
        merchant = random.choice(list(merchants_db.values()))
        order_id = f"o{i+1:04d}"
        status = random.choice(order_statuses)
        created_at = datetime.now() - timedelta(days=random.randint(0, 7), hours=random.randint(0, 23))
        expected_delivery_time = created_at + timedelta(minutes=45)
        
        order = Order(
            id=order_id,
            merchant_id=merchant.id,
            merchant_name=merchant.name,
            order_no=f"DD{datetime.now().strftime('%Y%m%d')}{i+1:04d}",
            customer_name=f"顾客{i+1}",
            customer_phone=f"139{random.randint(10000000, 99999999)}",
            delivery_address=f"北京市海淀区某某街道{i+1}号",
            goods_desc=f"商品套餐{i+1}",
            goods_amount=round(random.uniform(20, 200), 2),
            delivery_fee=round(random.uniform(3, 15), 2),
            total_amount=0,
            status=status,
            created_at=created_at,
            expected_delivery_time=expected_delivery_time,
            is_abnormal=(status == OrderStatus.ABNORMAL),
            abnormal_reason="配送超时" if status == OrderStatus.ABNORMAL else None,
            abnormal_time=created_at + timedelta(minutes=60) if status == OrderStatus.ABNORMAL else None
        )
        order.total_amount = round(order.goods_amount + order.delivery_fee, 2)
        orders_db[order_id] = order

    abnormal_orders = [o for o in orders_db.values() if o.is_abnormal]
    appeal_reasons = ["配送超时", "商品损坏", "错送漏送", "用户拒收", "其他"]
    for i, order in enumerate(abnormal_orders[:15]):
        appeal_id = f"a{i+1:04d}"
        status = random.choice([AppealStatus.PENDING, AppealStatus.APPROVED, AppealStatus.REJECTED, AppealStatus.NEED_REVIEW])
        appeals_db[appeal_id] = Appeal(
            id=appeal_id,
            order_id=order.id,
            order_no=order.order_no,
            merchant_id=order.merchant_id,
            merchant_name=order.merchant_name,
            type=random.choice(["subsidy", "refund", "other"]),
            reason=random.choice(appeal_reasons),
            description=f"这是申诉描述内容{i+1}，详细说明了异常情况的经过和商家的诉求。",
            screenshot_urls=[f"https://example.com/screenshot/{appeal_id}_{j}.jpg" for j in range(random.randint(1, 3))],
            status=status,
            created_at=order.abnormal_time + timedelta(minutes=random.randint(5, 60)),
            processed_at=datetime.now() - timedelta(hours=random.randint(1, 48)) if status != AppealStatus.PENDING else None,
            processor="运营专员" if status != AppealStatus.PENDING else None,
            process_note="已核实情况，同意补贴" if status == AppealStatus.APPROVED else ("情况不符，驳回申诉" if status == AppealStatus.REJECTED else None),
            subsidy_amount=round(random.uniform(5, 50), 2) if status == AppealStatus.APPROVED else None
        )

    approved_appeals = [a for a in appeals_db.values() if a.status == AppealStatus.APPROVED]
    for i, appeal in enumerate(approved_appeals):
        subsidy_id = f"s{i+1:04d}"
        subsidies_db[subsidy_id] = Subsidy(
            id=subsidy_id,
            order_id=appeal.order_id,
            order_no=appeal.order_no,
            merchant_id=appeal.merchant_id,
            merchant_name=appeal.merchant_name,
            appeal_id=appeal.id,
            type=SubsidyType.OVERTIME,
            amount=appeal.subsidy_amount or 20.0,
            reason=appeal.reason,
            description=appeal.description,
            created_at=appeal.processed_at or datetime.now(),
            created_by="系统自动",
            is_settled=random.choice([True, False])
        )

    for i, merchant in enumerate(list(merchants_db.values())[:3]):
        settlement_id = f"set{i+1:04d}"
        period_start = datetime.now() - timedelta(days=7)
        period_end = datetime.now()
        merchant_orders = [o for o in orders_db.values() if o.merchant_id == merchant.id]
        merchant_subsidies = [s for s in subsidies_db.values() if s.merchant_id == merchant.id]
        
        settlements_db[settlement_id] = Settlement(
            id=settlement_id,
            merchant_id=merchant.id,
            merchant_name=merchant.name,
            period_start=period_start,
            period_end=period_end,
            total_orders=len(merchant_orders),
            total_goods_amount=sum(o.goods_amount for o in merchant_orders),
            total_delivery_fee=sum(o.delivery_fee for o in merchant_orders),
            total_subsidy=sum(s.amount for s in merchant_subsidies),
            total_deduction=round(random.uniform(0, 100), 2),
            net_amount=0,
            status=random.choice(["pending", "processing", "completed"]),
            created_at=period_end
        )
        s = settlements_db[settlement_id]
        s.net_amount = round(s.total_goods_amount - s.total_delivery_fee + s.total_subsidy - s.total_deduction, 2)

init_mock_data()

def add_operation_log(**kwargs):
    log_id = f"log{len(operation_logs_db)+1:06d}"
    log = OperationLog(
        id=log_id,
        created_at=datetime.now(),
        **kwargs
    )
    operation_logs_db[log_id] = log
    return log

@app.get("/")
async def root():
    return {"message": "跑腿平台-商家结算与异常补贴 API", "version": "1.0"}

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    pending_appeals = len([a for a in appeals_db.values() if a.status == AppealStatus.PENDING])
    rejected_appeals = len([a for a in appeals_db.values() if a.status == AppealStatus.REJECTED])
    need_review = len([a for a in appeals_db.values() if a.status == AppealStatus.NEED_REVIEW])
    abnormal_orders = len([o for o in orders_db.values() if o.is_abnormal])
    pending_settlements = len([s for s in settlements_db.values() if s.status == "pending"])
    total_subsidy = sum(s.amount for s in subsidies_db.values())
    
    return {
        "pending_appeals": pending_appeals,
        "rejected_appeals": rejected_appeals,
        "need_review": need_review,
        "abnormal_orders": abnormal_orders,
        "pending_settlements": pending_settlements,
        "total_subsidy": round(total_subsidy, 2)
    }

@app.get("/api/orders")
async def get_orders(status: Optional[str] = None, is_abnormal: Optional[bool] = None, page: int = 1, page_size: int = 20):
    orders = list(orders_db.values())
    
    if status:
        orders = [o for o in orders if o.status == status]
    if is_abnormal is not None:
        orders = [o for o in orders if o.is_abnormal == is_abnormal]
    
    orders.sort(key=lambda x: x.created_at, reverse=True)
    
    total = len(orders)
    start = (page - 1) * page_size
    end = start + page_size
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": orders[start:end]
    }

@app.get("/api/orders/{order_id}")
async def get_order(order_id: str):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    return orders_db[order_id]

@app.get("/api/appeals")
async def get_appeals(status: Optional[str] = None, page: int = 1, page_size: int = 20):
    appeals = list(appeals_db.values())
    
    if status:
        appeals = [a for a in appeals if a.status == status]
    
    appeals.sort(key=lambda x: x.created_at, reverse=True)
    
    total = len(appeals)
    start = (page - 1) * page_size
    end = start + page_size
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": appeals[start:end]
    }

@app.get("/api/appeals/{appeal_id}")
async def get_appeal(appeal_id: str):
    if appeal_id not in appeals_db:
        raise HTTPException(status_code=404, detail="申诉不存在")
    return appeals_db[appeal_id]

class ProcessAppealRequest(BaseModel):
    status: str
    process_note: str
    subsidy_amount: Optional[float] = None
    processor: str = "运营专员"

@app.post("/api/appeals/{appeal_id}/process")
async def process_appeal(appeal_id: str, request: ProcessAppealRequest):
    if appeal_id not in appeals_db:
        raise HTTPException(status_code=404, detail="申诉不存在")
    
    appeal = appeals_db[appeal_id]
    old_status = appeal.status
    
    appeal.status = request.status
    appeal.process_note = request.process_note
    appeal.processed_at = datetime.now()
    appeal.processor = request.processor
    appeal.subsidy_amount = request.subsidy_amount
    
    add_operation_log(
        appeal_id=appeal_id,
        order_id=appeal.order_id,
        action="process_appeal",
        operator=request.processor,
        operator_role="运营专员",
        description=f"处理申诉: {appeal.reason}",
        old_value=old_status,
        new_value=request.status
    )
    
    if request.status == AppealStatus.APPROVED and request.subsidy_amount:
        subsidy_id = f"s{len(subsidies_db)+1:04d}"
        subsidies_db[subsidy_id] = Subsidy(
            id=subsidy_id,
            order_id=appeal.order_id,
            order_no=appeal.order_no,
            merchant_id=appeal.merchant_id,
            merchant_name=appeal.merchant_name,
            appeal_id=appeal_id,
            type="overtime",
            amount=request.subsidy_amount,
            reason=appeal.reason,
            description=f"申诉审批通过自动补贴: {request.process_note}",
            created_at=datetime.now(),
            created_by=request.processor
        )
    
    return appeal

@app.get("/api/subsidies")
async def get_subsidies(is_settled: Optional[bool] = None, page: int = 1, page_size: int = 20):
    subsidies = list(subsidies_db.values())
    
    if is_settled is not None:
        subsidies = [s for s in subsidies if s.is_settled == is_settled]
    
    subsidies.sort(key=lambda x: x.created_at, reverse=True)
    
    total = len(subsidies)
    start = (page - 1) * page_size
    end = start + page_size
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": subsidies[start:end]
    }

@app.get("/api/settlements")
async def get_settlements(status: Optional[str] = None, page: int = 1, page_size: int = 20):
    settlements = list(settlements_db.values())
    
    if status:
        settlements = [s for s in settlements if s.status == status]
    
    settlements.sort(key=lambda x: x.created_at, reverse=True)
    
    total = len(settlements)
    start = (page - 1) * page_size
    end = start + page_size
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": settlements[start:end]
    }

@app.get("/api/merchants")
async def get_merchants():
    return list(merchants_db.values())

@app.get("/api/operation-logs")
async def get_operation_logs(order_id: Optional[str] = None, appeal_id: Optional[str] = None, page: int = 1, page_size: int = 50):
    logs = list(operation_logs_db.values())
    
    if order_id:
        logs = [l for l in logs if l.order_id == order_id]
    if appeal_id:
        logs = [l for l in logs if l.appeal_id == appeal_id]
    
    logs.sort(key=lambda x: x.created_at, reverse=True)
    
    total = len(logs)
    start = (page - 1) * page_size
    end = start + page_size
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": logs[start:end]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
