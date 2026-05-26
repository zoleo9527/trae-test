from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date, datetime
from app.database import get_db
from app import schemas, crud, models

router = APIRouter(prefix="/api/repairs", tags=["售后返修"])


@router.post("", response_model=schemas.RepairOrder)
def create_repair(obj: schemas.RepairOrderCreate, db: Session = Depends(get_db)):
    if obj.optometry_order_id:
        opt = crud.get_optometry_order(db, obj.optometry_order_id)
        if not opt:
            raise HTTPException(status_code=400, detail=f"关联的验光单ID {obj.optometry_order_id} 不存在")
    db_obj = crud.create_repair_order(db, obj)
    return db_obj


@router.get("", response_model=List[schemas.RepairOrder])
def list_repairs(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    store: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
):
    return crud.get_repair_orders(
        db, skip=skip, limit=limit, status=status,
        keyword=keyword, store=store, date_from=date_from, date_to=date_to
    )


@router.get("/{id}", response_model=schemas.RepairOrder)
def get_repair(id: int, db: Session = Depends(get_db)):
    obj = crud.get_repair_order(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="返修单不存在")
    return obj


@router.put("/{id}", response_model=schemas.RepairOrder)
def update_repair(id: int, obj: schemas.RepairOrderUpdate, db: Session = Depends(get_db)):
    db_obj = crud.update_repair_order(db, id, obj)
    if not db_obj:
        raise HTTPException(status_code=404, detail="返修单不存在")
    return db_obj


@router.post("/batch-update")
def batch_update_repairs(obj: schemas.BatchRepairUpdate, db: Session = Depends(get_db)):
    count = crud.batch_update_repair_orders(
        db, obj.ids, status=obj.status, processor=obj.processor, handler=obj.handler
    )
    return {"updated": count}


@router.delete("/{id}")
def delete_repair(id: int, db: Session = Depends(get_db)):
    if not crud.delete_repair_order(db, id):
        raise HTTPException(status_code=404, detail="返修单不存在")
    return {"message": "删除成功"}


@router.post("/{id}/status")
def update_repair_status(
    id: int,
    new_status: str = Query(...),
    changed_by: str = Query(...),
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
):
    db_obj = crud.get_repair_order(db, id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="返修单不存在")
    extra = {}
    if new_status == "已完成":
        extra["completed_at"] = datetime.now()
    result = crud.update_repair_order_status(db, id, new_status, changed_by, reason, extra)
    return result


@router.get("/{id}/history")
def get_repair_history(id: int, db: Session = Depends(get_db)):
    obj = crud.get_repair_order(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="返修单不存在")
    return crud.get_status_history(db, id)


@router.get("/simple/list")
def get_repairs_simple(db: Session = Depends(get_db)):
    repairs = db.query(models.RepairOrder).filter(
        models.RepairOrder.status.notin_(["已完成", "已退款", "已驳回"])
    ).order_by(models.RepairOrder.created_at.desc()).limit(100).all()
    return [
        {"id": r.id, "repair_no": r.repair_no, "customer_name": r.customer_name,
         "store_name": r.store_name, "repair_type": r.repair_type, "status": r.status}
        for r in repairs
    ]
