from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import Order, OrderItem, OrderTimeline
from app.schemas import (
    OrderCreate, OrderUpdate, OrderResponse, OrderListResponse,
    OrderItemCreate, OrderItemUpdate, OrderItemResponse,
    PaginatedOrders,
)

router = APIRouter()


def _generate_order_no(db: Session) -> str:
    today = datetime.now()
    prefix = f"SO{today.strftime('%Y%m%d')}"
    last_order = db.query(Order).filter(Order.order_no.like(f"{prefix}%")).order_by(Order.order_no.desc()).first()
    if last_order:
        last_num = int(last_order.order_no[-3:])
        return f"{prefix}{last_num + 1:03d}"
    return f"{prefix}001"


def _add_timeline(db: Session, order_id: int, event_type: str, event_description: str, operator_name: str = "系统"):
    timeline = OrderTimeline(
        order_id=order_id,
        event_type=event_type,
        event_description=event_description,
        operator_name=operator_name,
    )
    db.add(timeline)
    db.flush()


@router.get("", response_model=PaginatedOrders)
def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    status: str = Query(None),
    keyword: str = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    if keyword:
        like = f"%{keyword}%"
        query = query.filter(
            (Order.order_no.like(like))
            | (Order.customer_name.like(like))
            | (Order.customer_phone.like(like))
        )
    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedOrders(
        total=total,
        page=page,
        page_size=page_size,
        orders=[OrderListResponse.model_validate(o) for o in orders],
    )


@router.get("/stats")
def get_order_stats(db: Session = Depends(get_db)):
    orders = db.query(Order).all()
    stats = {
        "total": len(orders),
        "by_status": {},
        "total_amount": sum(o.total_amount for o in orders),
        "pending": 0,
        "after_sales": 0,
        "installing": 0,
        "arrived": 0,
    }
    for o in orders:
        if o.status not in stats["by_status"]:
            stats["by_status"][o.status] = 0
        stats["by_status"][o.status] += 1
        if o.status in ("pending", "confirmed", "producing"):
            stats["pending"] += 1
        if o.status == "after_sales":
            stats["after_sales"] += 1
        if o.status == "installing":
            stats["installing"] += 1
        if o.status == "arrived":
            stats["arrived"] += 1
    return stats


@router.post("", response_model=OrderResponse)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    order_no = _generate_order_no(db)
    order = Order(
        order_no=order_no,
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        customer_address=order_data.customer_address,
        total_amount=order_data.total_amount,
        deposit_amount=order_data.deposit_amount,
        sales_consultant_id=order_data.sales_consultant_id,
        showroom_manager_id=order_data.showroom_manager_id,
        expected_delivery_date=order_data.expected_delivery_date,
        remarks=order_data.remarks,
        status="pending",
    )
    db.add(order)
    db.flush()

    for item_data in order_data.items:
        item = OrderItem(
            order_id=order.id,
            product_name=item_data.product_name,
            product_code=item_data.product_code,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            subtotal=item_data.quantity * item_data.unit_price,
            status="pending",
            remarks=item_data.remarks,
        )
        db.add(item)
        db.flush()

    _add_timeline(db, order.id, "order_created", f"订单创建：{order_no}，总金额{order.total_amount:,.0f}元，定金{order.deposit_amount:,.0f}元")

    db.commit()
    db.refresh(order)
    return OrderResponse.model_validate(order)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return OrderResponse.model_validate(order)


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, update_data: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    old_status = order.status
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    order.updated_at = datetime.now()

    if update_data.status and update_data.status != old_status:
        status_map = {
            "pending": "待确认", "confirmed": "已确认", "producing": "生产中",
            "shipped": "已发货", "partial_arrived": "部分到货", "arrived": "已到货",
            "installing": "安装中", "completed": "已完成", "cancelled": "已取消",
            "after_sales": "售后中",
        }
        _add_timeline(db, order.id, "status_change", f"订单状态变更为：{status_map.get(update_data.status, update_data.status)}")

    db.commit()
    db.refresh(order)
    return OrderResponse.model_validate(order)


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    db.delete(order)
    db.commit()
    return {"message": "订单已删除"}


@router.post("/{order_id}/items", response_model=OrderItemResponse)
def add_order_item(order_id: int, item_data: OrderItemCreate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    item = OrderItem(
        order_id=order_id,
        product_name=item_data.product_name,
        product_code=item_data.product_code,
        quantity=item_data.quantity,
        unit_price=item_data.unit_price,
        subtotal=item_data.quantity * item_data.unit_price,
        status="pending",
        remarks=item_data.remarks,
    )
    db.add(item)
    db.flush()
    _add_timeline(db, order_id, "item_added", f"添加商品：{item.product_name} ×{item.quantity}")
    db.commit()
    db.refresh(item)
    return OrderItemResponse.model_validate(item)


@router.put("/{order_id}/items/{item_id}", response_model=OrderItemResponse)
def update_order_item(order_id: int, item_id: int, update_data: OrderItemUpdate, db: Session = Depends(get_db)):
    item = db.query(OrderItem).filter(OrderItem.id == item_id, OrderItem.order_id == order_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="商品不存在")
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    if update_data.quantity and update_data.unit_price:
        item.subtotal = update_data.quantity * update_data.unit_price
    db.commit()
    db.refresh(item)
    return OrderItemResponse.model_validate(item)


@router.delete("/{order_id}/items/{item_id}")
def delete_order_item(order_id: int, item_id: int, db: Session = Depends(get_db)):
    item = db.query(OrderItem).filter(OrderItem.id == item_id, OrderItem.order_id == order_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="商品不存在")
    db.delete(item)
    db.commit()
    return {"message": "商品已删除"}