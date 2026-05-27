from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import date, datetime
from uuid import uuid4

from database import db
from schemas import (
    User, UserLogin, Customer, Order, Route, RouteDetail,
    ExceptionReport, ExceptionCreate, ExceptionHandle,
    BucketTransaction, DashboardStats, DeliverySignRequest
)

app = FastAPI(
    title="桶装水配送管理系统 API",
    description="订水路线与司机签收管理系统后端接口",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "message": "桶装水配送管理系统 API 运行正常"}


@app.post("/api/auth/login", response_model=User, tags=["认证"])
async def login(login_data: UserLogin):
    user = next(
        (u for u in db.users if u["username"] == login_data.username and u["password"] == login_data.password),
        None
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    return user


@app.get("/api/users", response_model=List[User], tags=["用户"])
async def get_users(role: Optional[str] = None):
    users = db.users
    if role:
        users = [u for u in users if u["role"] == role]
    return users


@app.get("/api/customers", response_model=List[Customer], tags=["客户"])
async def get_customers(search: Optional[str] = None):
    customers = db.customers
    if search:
        search_lower = search.lower()
        customers = [
            c for c in customers
            if search_lower in c["name"].lower()
            or search_lower in c["contact"].lower()
            or search_lower in c["phone"]
        ]
    return customers


@app.get("/api/customers/{customer_id}", response_model=Customer, tags=["客户"])
async def get_customer(customer_id: str):
    customer = next((c for c in db.customers if c["id"] == customer_id), None)
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    return customer


@app.get("/api/routes", response_model=List[Route], tags=["路线"])
async def get_routes(status: Optional[str] = None, date: Optional[str] = None):
    routes = db.routes
    if status:
        routes = [r for r in routes if r["status"] == status]
    if date:
        routes = [r for r in routes if r["date"] == date]
    return routes


@app.get("/api/routes/{route_id}", response_model=RouteDetail, tags=["路线"])
async def get_route_detail(route_id: str):
    route = next((r for r in db.routes if r["id"] == route_id), None)
    if not route:
        raise HTTPException(status_code=404, detail="路线不存在")
    
    route_orders = [o for o in db.orders if o["delivery_route_id"] == route_id]
    route_orders.sort(key=lambda x: x.get("delivery_sequence", 0))
    
    return {**route, "orders": route_orders}


@app.post("/api/routes/{route_id}/start", tags=["路线"])
async def start_route(route_id: str):
    route = next((r for r in db.routes if r["id"] == route_id), None)
    if not route:
        raise HTTPException(status_code=404, detail="路线不存在")
    
    route["status"] = "in_progress"
    route["start_time"] = datetime.now().isoformat()
    return {"status": "success", "message": "路线已开始"}


@app.post("/api/routes/{route_id}/complete", tags=["路线"])
async def complete_route(route_id: str):
    route = next((r for r in db.routes if r["id"] == route_id), None)
    if not route:
        raise HTTPException(status_code=404, detail="路线不存在")
    
    if route["pending_orders"] > 0:
        raise HTTPException(status_code=400, detail="还有待配送的订单，无法完成路线")
    if route["exception_orders"] > 0:
        raise HTTPException(status_code=400, detail="还有未处理的异常订单，无法完成路线")
    
    route["status"] = "completed"
    route["end_time"] = datetime.now().isoformat()
    return {"status": "success", "message": "路线已完成"}


@app.get("/api/orders", response_model=List[Order], tags=["订单"])
async def get_orders(
    status: Optional[str] = None,
    route_id: Optional[str] = None,
    customer_id: Optional[str] = None
):
    orders = db.orders
    if status:
        orders = [o for o in orders if o["status"] == status]
    if route_id:
        orders = [o for o in orders if o["delivery_route_id"] == route_id]
    if customer_id:
        orders = [o for o in orders if o["customer_id"] == customer_id]
    return orders


@app.get("/api/orders/{order_id}", response_model=Order, tags=["订单"])
async def get_order(order_id: str):
    order = next((o for o in db.orders if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@app.post("/api/orders/{order_id}/deliver", tags=["订单"])
async def deliver_order(order_id: str, sign_data: DeliverySignRequest):
    order = next((o for o in db.orders if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order["status"] = "delivered"
    order["delivered_quantity"] = sign_data.delivered_quantity
    order["returned_empty_buckets"] = sign_data.returned_empty_buckets
    order["recipient_signature"] = sign_data.recipient_signature
    order["signed_photo_url"] = sign_data.signed_photo_url
    order["actual_delivered_at"] = datetime.now().isoformat()
    
    route = next((r for r in db.routes if r["id"] == order["delivery_route_id"]), None)
    if route:
        route["delivered_orders"] += 1
        route["pending_orders"] -= 1
        route["delivered_buckets"] += sign_data.delivered_quantity
        route["returned_buckets"] += sign_data.returned_empty_buckets
    
    customer = next((c for c in db.customers if c["id"] == order["customer_id"]), None)
    if customer:
        old_outstanding = customer["outstanding_buckets"]
        customer["total_buckets_delivered"] += sign_data.delivered_quantity
        customer["total_buckets_returned"] += sign_data.returned_empty_buckets
        customer["outstanding_buckets"] = old_outstanding + sign_data.delivered_quantity - sign_data.returned_empty_buckets
        
        db.bucket_transactions.append({
            "id": f"bt_{uuid4().hex[:8]}",
            "customer_id": customer["id"],
            "customer_name": customer["name"],
            "order_id": order_id,
            "type": "delivery",
            "buckets_change": sign_data.delivered_quantity,
            "balance_before": old_outstanding,
            "balance_after": old_outstanding + sign_data.delivered_quantity,
            "operator": route["driver_name"] if route else "系统",
            "created_at": datetime.now().isoformat(),
            "note": f"配送{sign_data.delivered_quantity}桶"
        })
        
        db.bucket_transactions.append({
            "id": f"bt_{uuid4().hex[:8]}",
            "customer_id": customer["id"],
            "customer_name": customer["name"],
            "order_id": order_id,
            "type": "return",
            "buckets_change": -sign_data.returned_empty_buckets,
            "balance_before": old_outstanding + sign_data.delivered_quantity,
            "balance_after": old_outstanding + sign_data.delivered_quantity - sign_data.returned_empty_buckets,
            "operator": route["driver_name"] if route else "系统",
            "created_at": datetime.now().isoformat(),
            "note": f"回收空桶{sign_data.returned_empty_buckets}个"
        })
    
    return {"status": "success", "message": "订单已签收", "order": order}


@app.get("/api/exceptions", response_model=List[ExceptionReport], tags=["异常"])
async def get_exceptions(status: Optional[str] = None, route_id: Optional[str] = None):
    exceptions = db.exceptions
    if status:
        exceptions = [e for e in exceptions if e["status"] == status]
    if route_id:
        exceptions = [e for e in exceptions if e["route_id"] == route_id]
    return exceptions


@app.get("/api/exceptions/{exception_id}", response_model=ExceptionReport, tags=["异常"])
async def get_exception(exception_id: str):
    exception = next((e for e in db.exceptions if e["id"] == exception_id), None)
    if not exception:
        raise HTTPException(status_code=404, detail="异常记录不存在")
    return exception


@app.post("/api/exceptions", response_model=ExceptionReport, tags=["异常"])
async def create_exception(exception_data: ExceptionCreate):
    order = next((o for o in db.orders if o["id"] == exception_data.order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    was_pending = order["status"] == "pending"
    order["status"] = "exception"
    
    route = next((r for r in db.routes if r["id"] == exception_data.route_id), None)
    if route:
        route["exception_orders"] += 1
        if was_pending:
            route["pending_orders"] -= 1
    
    driver_name = route["driver_name"] if route else "司机"
    
    new_exception = {
        "id": f"exc_{uuid4().hex[:8]}",
        "order_id": exception_data.order_id,
        "route_id": exception_data.route_id,
        "type": exception_data.type,
        "title": exception_data.title,
        "description": exception_data.description,
        "reported_by": driver_name,
        "reported_at": datetime.now().isoformat(),
        "status": "pending",
        "handled_by": None,
        "handled_at": None,
        "resolution": None,
        "photos": exception_data.photos
    }
    
    db.exceptions.append(new_exception)
    return new_exception


@app.post("/api/exceptions/{exception_id}/handle", tags=["异常"])
async def handle_exception(exception_id: str, handle_data: ExceptionHandle):
    exception = next((e for e in db.exceptions if e["id"] == exception_id), None)
    if not exception:
        raise HTTPException(status_code=404, detail="异常记录不存在")
    
    exception["status"] = "resolved"
    exception["handled_by"] = handle_data.handled_by
    exception["handled_at"] = datetime.now().isoformat()
    exception["resolution"] = handle_data.resolution
    
    order = next((o for o in db.orders if o["id"] == exception["order_id"]), None)
    route = next((r for r in db.routes if r["id"] == exception["route_id"]), None)
    
    if order and route:
        route["exception_orders"] -= 1
        
        if handle_data.handle_type == "re_deliver":
            order["status"] = "pending"
            order["is_rescheduled"] = False
            route["pending_orders"] += 1
        elif handle_data.handle_type == "reschedule":
            order["status"] = "exception"
            order["is_rescheduled"] = True
            order["delivery_route_id"] = None
            order["delivery_sequence"] = None
        else:
            order["status"] = "delivered"
    
    return {"status": "success", "message": "异常已处理"}


@app.get("/api/bucket-transactions", response_model=List[BucketTransaction], tags=["空桶管理"])
async def get_bucket_transactions(customer_id: Optional[str] = None):
    transactions = db.bucket_transactions
    if customer_id:
        transactions = [t for t in transactions if t["customer_id"] == customer_id]
    transactions.sort(key=lambda x: x["created_at"], reverse=True)
    return transactions


@app.get("/api/dashboard/stats", response_model=DashboardStats, tags=["仪表板"])
async def get_dashboard_stats():
    today = date.today().isoformat()
    
    today_routes = [r for r in db.routes if r["date"] == today]
    today_orders = [o for o in db.orders if o["order_date"] == today]
    
    return {
        "today_routes": len(today_routes),
        "in_progress_routes": len([r for r in today_routes if r["status"] == "in_progress"]),
        "today_orders": len(today_orders),
        "delivered_orders": len([o for o in today_orders if o["status"] == "delivered"]),
        "pending_orders": len([o for o in today_orders if o["status"] == "pending"]),
        "exception_orders": len([o for o in today_orders if o["status"] == "exception"]),
        "total_buckets_delivered": sum(o["delivered_quantity"] for o in today_orders),
        "total_buckets_returned": sum(o["returned_empty_buckets"] for o in today_orders),
        "pending_exceptions": len([e for e in db.exceptions if e["status"] == "pending"])
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
