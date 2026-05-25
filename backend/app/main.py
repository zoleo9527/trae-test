from fastapi import FastAPI, Depends, HTTPException
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
            title = "演出状态变更"
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
def read_ticket_orders(performance_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_ticket_orders(db, performance_id=performance_id, skip=skip, limit=limit)


@app.post("/api/ticket-orders", response_model=schemas.TicketOrder)
def create_ticket_order(order: schemas.TicketOrderCreate, db: Session = Depends(get_db)):
    return crud.create_ticket_order(db=db, order=order)


@app.put("/api/ticket-orders/{order_id}", response_model=schemas.TicketOrder)
def update_ticket_order(order_id: int, order: schemas.TicketOrderUpdate, db: Session = Depends(get_db)):
    return crud.update_ticket_order(db=db, order_id=order_id, order=order)


@app.post("/api/init-sample-data")
def init_sample_data(db: Session = Depends(get_db)):
    if crud.get_performances(db, limit=1):
        return {"message": "数据已存在，跳过初始化"}
    
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
        db_p = crud.create_performance(db, p)
        
        crud.create_reception(db, schemas.ReceptionCreate(
            performance_id=db_p.id,
            hotel="剧院合作酒店",
            room_count=10,
            meal_count=25,
            transportation="大巴接送",
            notes="主演安排单间"
        ))
    
    artists = [
        schemas.ArtistCreate(name="李明", role="主演", troupe="北京人民艺术剧院", phone="13800138001"),
        schemas.ArtistCreate(name="王芳", role="主演", troupe="北京人民艺术剧院", phone="13800138002"),
        schemas.ArtistCreate(name="张伟", role="导演", troupe="中央芭蕾舞团", phone="13800138003"),
        schemas.ArtistCreate(name="陈静", role="首席舞者", troupe="中央芭蕾舞团", phone="13800138004"),
    ]
    
    for a in artists:
        crud.create_artist(db, a)
    
    db_p3 = crud.get_performances(db)[2]
    crud.create_settlement(db, schemas.SettlementCreate(
        performance_id=db_p3.id,
        performance_fee=50000,
        hotel_expense=8000,
        meal_expense=3000,
        transportation_expense=2000,
        other_expense=1000,
        ticket_revenue=120000
    ))
    
    return {"message": "示例数据初始化成功"}
