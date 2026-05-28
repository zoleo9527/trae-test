from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
import crud
from database import engine, SessionLocal, get_db

models.Base.metadata.create_all(bind=engine)

# seed data on first startup
with SessionLocal() as db:
    crud.seed_database(db)

app = FastAPI(
    title="婚纱影楼 · 修片回传与客户复核系统",
    version="0.1.0",
    description="统一档期、选片、修片回传、客户复核与尾款催收的工作台",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/dashboard", response_model=schemas.DashboardStats)
def dashboard(db: Session = Depends(get_db)):
    return crud.get_dashboard(db)


@app.get("/api/orders", response_model=List[schemas.OrderListItem])
def list_orders(
    status: Optional[str] = Query(None),
    studio: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return crud.get_orders(db, status=status, studio=studio, keyword=keyword)


@app.get("/api/orders/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    o = crud.get_order(db, order_id)
    if not o:
        raise HTTPException(status_code=404, detail="订单不存在")
    return o


@app.post("/api/orders/{order_id}/batches", response_model=schemas.BatchOut)
def create_batch(order_id: int, payload: schemas.BatchCreate, db: Session = Depends(get_db)):
    batch = crud.add_batch(db, order_id, payload)
    if not batch:
        raise HTTPException(status_code=404, detail="订单不存在")
    return batch


@app.get("/api/batches/{batch_id}", response_model=schemas.BatchOut)
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    b = crud.get_batch(db, batch_id)
    if not b:
        raise HTTPException(status_code=404, detail="批次不存在")
    return b


@app.post("/api/photos/{photo_id}/review", response_model=schemas.PhotoOut)
def review_photo(photo_id: int, payload: schemas.ReviewSubmit, db: Session = Depends(get_db)):
    p = crud.submit_review(db, photo_id, payload)
    if not p:
        raise HTTPException(status_code=404, detail="照片不存在")
    return p


@app.post("/api/photos/{photo_id}/resubmit", response_model=schemas.PhotoOut)
def resubmit_photo(photo_id: int, payload: schemas.ResubmitPhoto, db: Session = Depends(get_db)):
    p = crud.resubmit_photo(db, photo_id, payload)
    if not p:
        raise HTTPException(status_code=404, detail="照片不存在")
    return p


@app.get("/api/orders/{order_id}/timeline", response_model=List[schemas.TimelineEventOut])
def get_order_timeline(order_id: int, db: Session = Depends(get_db)):
    o = crud.get_order(db, order_id)
    if not o:
        raise HTTPException(status_code=404, detail="订单不存在")
    return sorted(o.timeline, key=lambda e: e.created_at, reverse=True)


@app.get("/api/orders/{order_id}/continuous-review")
def continuous_review(order_id: int, db: Session = Depends(get_db)):
    """连续回查面板：返回同一订单所有批次的照片历史，按 version 聚合，供前后对比。"""
    o = crud.get_order(db, order_id)
    if not o:
        raise HTTPException(status_code=404, detail="订单不存在")

    groups = []
    for batch in sorted(o.batches, key=lambda b: b.batch_no):
        photos = []
        for p in batch.photos:
            photos.append({
                "id": p.id,
                "photo_name": p.photo_name,
                "category": p.category,
                "image_url": p.image_url,
                "version": p.version,
                "review_status": p.review_status,
                "latest_feedback": p.latest_feedback,
                "source_photo_id": p.source_photo_id,
                "reviews": [
                    {
                        "id": r.id,
                        "reviewer": r.reviewer,
                        "verdict": r.verdict,
                        "feedback": r.feedback,
                        "version_at_review": r.version_at_review,
                        "created_at": r.created_at.isoformat(),
                    }
                    for r in p.reviews
                ],
            })
        groups.append({
            "batch_id": batch.id,
            "batch_no": batch.batch_no,
            "status": batch.status,
            "remark": batch.remark,
            "delivered_at": batch.delivered_at.isoformat() if batch.delivered_at else None,
            "photos": photos,
        })

    return {
        "order": {
            "id": o.id,
            "order_no": o.order_no,
            "customer_name": o.customer_name,
            "partner_name": o.partner_name,
            "status": o.status,
            "balance_status": o.balance_status,
        },
        "batches": groups,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
