from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from . import crud, models, schemas
from .database import SessionLocal, engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="地方剧院-演职接待与费用结算系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "地方剧院管理系统 API"}


@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)


@app.get("/api/performances", response_model=List[schemas.Performance])
def read_performances(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_performances(db, skip=skip, limit=limit)


@app.get("/api/performances/{performance_id}", response_model=schemas.Performance)
def read_performance(performance_id: int, db: Session = Depends(get_db)):
    db_performance = crud.get_performance(db, performance_id=performance_id)
    if db_performance is None:
        raise HTTPException(status_code=404, detail="演出场次不存在")
    return db_performance


@app.post("/api/performances", response_model=schemas.Performance)
def create_performance(performance: schemas.PerformanceCreate, db: Session = Depends(get_db)):
    return crud.create_performance(db=db, performance=performance)


@app.put("/api/performances/{performance_id}", response_model=schemas.Performance)
def update_performance(performance_id: int, performance: schemas.PerformanceUpdate, db: Session = Depends(get_db)):
    return crud.update_performance(db=db, performance_id=performance_id, performance=performance)


@app.delete("/api/performances/{performance_id}")
def delete_performance(performance_id: int, db: Session = Depends(get_db)):
    crud.delete_performance(db=db, performance_id=performance_id)
    return {"message": "删除成功"}


@app.get("/api/artists", response_model=List[schemas.Artist])
def read_artists(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_artists(db, skip=skip, limit=limit)


@app.post("/api/artists", response_model=schemas.Artist)
def create_artist(artist: schemas.ArtistCreate, db: Session = Depends(get_db)):
    return crud.create_artist(db=db, artist=artist)


@app.get("/api/receptions", response_model=List[schemas.Reception])
def read_receptions(skip: int = 0, limit: int = 100, status: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_receptions(db, skip=skip, limit=limit, status=status)


@app.get("/api/receptions/{reception_id}", response_model=schemas.Reception)
def read_reception(reception_id: int, db: Session = Depends(get_db)):
    db_reception = crud.get_reception(db, reception_id=reception_id)
    if db_reception is None:
        raise HTTPException(status_code=404, detail="接待记录不存在")
    return db_reception


@app.post("/api/receptions", response_model=schemas.Reception)
def create_reception(reception: schemas.ReceptionCreate, db: Session = Depends(get_db)):
    return crud.create_reception(db=db, reception=reception)


@app.put("/api/receptions/{reception_id}", response_model=schemas.Reception)
def update_reception(reception_id: int, reception: schemas.ReceptionUpdate, db: Session = Depends(get_db)):
    return crud.update_reception(db=db, reception_id=reception_id, reception=reception)


@app.get("/api/settlements", response_model=List[schemas.Settlement])
def read_settlements(skip: int = 0, limit: int = 100, status: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_settlements(db, skip=skip, limit=limit, status=status)


@app.get("/api/settlements/{settlement_id}", response_model=schemas.Settlement)
def read_settlement(settlement_id: int, db: Session = Depends(get_db)):
    db_settlement = crud.get_settlement(db, settlement_id=settlement_id)
    if db_settlement is None:
        raise HTTPException(status_code=404, detail="结算记录不存在")
    return db_settlement


@app.post("/api/settlements", response_model=schemas.Settlement)
def create_settlement(settlement: schemas.SettlementCreate, db: Session = Depends(get_db)):
    return crud.create_settlement(db=db, settlement=settlement)


@app.put("/api/settlements/{settlement_id}", response_model=schemas.Settlement)
def update_settlement(settlement_id: int, settlement: schemas.SettlementUpdate, db: Session = Depends(get_db)):
    return crud.update_settlement(db=db, settlement_id=settlement_id, settlement=settlement)


@app.get("/api/status-history", response_model=List[schemas.StatusHistory])
def read_status_history(performance_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_status_history(db, performance_id=performance_id, skip=skip, limit=limit)


@app.get("/api/timeline")
def get_timeline(performance_id: Optional[int] = None, db: Session = Depends(get_db)):
    histories = crud.get_status_history(db, performance_id=performance_id, limit=50)
    timeline_items = []
    for h in histories:
        title = ""
        if h.entity_type == "reception":
            title = "接待状态变更"
        elif h.entity_type == "settlement":
            title = "结算状态变更"
        elif h.entity_type == "performance":
            if "时间变更" in (h.change_reason or ""):
                title = "演出时间变更"
            elif "场地变更" in (h.change_reason or ""):
                title = "演出场地变更"
            elif "状态变更" in (h.change_reason or ""):
                title = "演出状态变更"
            elif "新建" in (h.change_reason or ""):
                title = "新建演出"
            elif "删除" in (h.change_reason or ""):
                title = "删除演出"
            else:
                title = "演出场次变更"
        elif h.entity_type == "ticket":
            title = "票务退改审批"
        timeline_items.append(schemas.TimelineItem(
            id=h.id,
            entity_type=h.entity_type,
            entity_id=h.entity_id,
            title=title,
            old_status=h.old_status,
            new_status=h.new_status,
            changed_by=h.changed_by,
            change_reason=h.change_reason,
            created_at=h.created_at
        ))
    return timeline_items


@app.get("/api/ticket-orders", response_model=List[schemas.TicketOrder])
def read_ticket_orders(
    performance_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return crud.get_ticket_orders(db, performance_id=performance_id, status=status, skip=skip, limit=limit)


@app.get("/api/ticket-orders/{order_id}", response_model=schemas.TicketOrder)
def read_ticket_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_ticket_order(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="票务订单不存在")
    return db_order


@app.post("/api/ticket-orders", response_model=schemas.TicketOrder)
def create_ticket_order(order: schemas.TicketOrderCreate, db: Session = Depends(get_db)):
    return crud.create_ticket_order(db=db, order=order)


@app.put("/api/ticket-orders/{order_id}", response_model=schemas.TicketOrder)
def update_ticket_order(order_id: int, order: schemas.TicketOrderUpdate, db: Session = Depends(get_db)):
    return crud.update_ticket_order(db=db, order_id=order_id, order=order)


@app.post("/api/ticket-orders/{order_id}/refund-request")
def request_refund(
    order_id: int,
    refund_reason: str = Query(..., description="退票原因"),
    refund_applicant: str = Query("customer", description="申请人"),
    db: Session = Depends(get_db)
):
    order = schemas.TicketOrderUpdate(
        status="refund_pending",
        refund_reason=refund_reason,
        refund_applicant=refund_applicant
    )
    return crud.update_ticket_order(db=db, order_id=order_id, order=order)


@app.post("/api/ticket-orders/{order_id}/refund-approve")
def approve_refund(
    order_id: int,
    approval_notes: str = Query("", description="审批备注"),
    approver: str = Query("system", description="审批人"),
    db: Session = Depends(get_db)
):
    order = schemas.TicketOrderUpdate(
        status="refunded",
        refund_approver=approver,
        refund_approval_notes=approval_notes
    )
    return crud.update_ticket_order(db=db, order_id=order_id, order=order)


@app.post("/api/ticket-orders/{order_id}/refund-reject")
def reject_refund(
    order_id: int,
    approval_notes: str = Query("退票申请被驳回", description="驳回原因"),
    approver: str = Query("system", description="审批人"),
    db: Session = Depends(get_db)
):
    order = schemas.TicketOrderUpdate(
        status="refund_rejected",
        refund_approver=approver,
        refund_approval_notes=approval_notes
    )
    return crud.update_ticket_order(db=db, order_id=order_id, order=order)


@app.post("/api/init-sample-data")
def init_sample_data(db: Session = Depends(get_db)):
    if crud.get_performances(db, limit=1):
        return {"message": "数据已存在，跳过初始化。如需重置请删除 theater.db 文件后重启服务。"}
    
    base_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    performances = [
        schemas.PerformanceCreate(
            name="话剧《雷雨》",
            troupe="北京人民艺术剧院",
            start_time=base_date + timedelta(days=2, hours=19, minutes=30),
            end_time=base_date + timedelta(days=2, hours=22),
            venue="大剧院主厅",
            total_tickets=500
        ),
        schemas.PerformanceCreate(
            name="芭蕾舞剧《天鹅湖》",
            troupe="中央芭蕾舞团",
            start_time=base_date + timedelta(days=5, hours=19, minutes=30),
            end_time=base_date + timedelta(days=5, hours=22),
            venue="大剧院主厅",
            total_tickets=600
        ),
        schemas.PerformanceCreate(
            name="京剧《霸王别姬》",
            troupe="国家京剧院",
            start_time=base_date + timedelta(days=-1, hours=19, minutes=30),
            end_time=base_date + timedelta(days=-1, hours=21, minutes=30),
            venue="大剧院主厅",
            total_tickets=400
        ),
    ]
    
    for p in performances:
        crud.create_performance(db, p)
    
    artists = [
        schemas.ArtistCreate(name="李明", role="主演", troupe="北京人民艺术剧院", phone="13800138001"),
        schemas.ArtistCreate(name="王芳", role="主演", troupe="北京人民艺术剧院", phone="13800138002"),
        schemas.ArtistCreate(name="张伟", role="导演", troupe="中央芭蕾舞团", phone="13800138003"),
        schemas.ArtistCreate(name="陈静", role="首席舞者", troupe="中央芭蕾舞团", phone="13800138004"),
    ]
    
    for a in artists:
        crud.create_artist(db, a)
    
    all_performances = crud.get_performances(db)
    
    if len(all_performances) >= 2:
        order1 = crud.create_ticket_order(db, schemas.TicketOrderCreate(
            performance_id=all_performances[0].id,
            customer_name="张三",
            customer_phone="13900139001",
            ticket_count=2,
            total_price=360
        ))
        order2 = crud.create_ticket_order(db, schemas.TicketOrderCreate(
            performance_id=all_performances[1].id,
            customer_name="李四",
            customer_phone="13900139002",
            ticket_count=3,
            total_price=540
        ))
        
        crud.update_ticket_order(db, order1.id, schemas.TicketOrderUpdate(
            status="refund_pending",
            refund_reason="行程冲突，无法到场",
            refund_applicant="张三"
        ))
        
        crud.update_ticket_order(db, order2.id, schemas.TicketOrderUpdate(
            status="refund_pending",
            refund_reason="看错时间了",
            refund_applicant="李四"
        ))
        crud.update_ticket_order(db, order2.id, schemas.TicketOrderUpdate(
            status="refund_rejected",
            refund_approver="王经理",
            refund_approval_notes="演出临近，已超过退票期限"
        ))
    
    all_receptions = crud.get_receptions(db)
    all_settlements = crud.get_settlements(db)
    
    if len(all_receptions) >= 2:
        crud.update_reception(db, all_receptions[1].id, schemas.ReceptionUpdate(
            status="reviewing",
            hotel="如家精选酒店",
            room_count=5,
            meal_count=8
        ))
    
    if len(all_settlements) >= 3:
        crud.update_settlement(db, all_settlements[1].id, schemas.SettlementUpdate(
            status="reviewing",
            performance_fee=50000,
            hotel_expense=3000,
            meal_expense=1500,
            transportation_expense=500,
            other_expense=0,
            ticket_revenue=80000
        ))
        crud.update_settlement(db, all_settlements[2].id, schemas.SettlementUpdate(
            status="reviewing",
            performance_fee=40000,
            hotel_expense=2000,
            meal_expense=1000,
            transportation_expense=300,
            other_expense=0,
            ticket_revenue=60000
        ))
        crud.update_settlement(db, all_settlements[2].id, schemas.SettlementUpdate(
            status="rejected",
            approver="财务李总",
            approval_notes="演出费用明细不全，缺少演员个税缴纳证明，请补充后重新提交"
        ))
    
    if len(all_performances) >= 1:
        crud.update_performance(db, all_performances[0].id, schemas.PerformanceUpdate(
            venue="实验剧场"
        ))
    
    return {"message": "示例数据初始化成功，已创建演出、接待、结算记录及票务订单"}
