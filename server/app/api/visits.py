from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.database import get_db
from app import schemas, crud, models

router = APIRouter(prefix="/api/visits", tags=["回访记录"])


@router.post("", response_model=schemas.VisitRecord)
def create_visit(obj: schemas.VisitRecordCreate, db: Session = Depends(get_db)):
    if obj.repair_order_id:
        repair = crud.get_repair_order(db, obj.repair_order_id)
        if not repair:
            raise HTTPException(status_code=400, detail=f"关联的返修单ID {obj.repair_order_id} 不存在")
    return crud.create_visit_record(db, obj)


@router.get("", response_model=list[schemas.VisitRecord])
def list_visits(
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
):
    return crud.get_visit_records(
        db, skip=skip, limit=limit, status=status,
        date_from=date_from, date_to=date_to
    )


@router.get("/{id}", response_model=schemas.VisitRecord)
def get_visit(id: int, db: Session = Depends(get_db)):
    obj = crud.get_visit_record(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="回访记录不存在")
    return obj


@router.put("/{id}", response_model=schemas.VisitRecord)
def update_visit(id: int, obj: schemas.VisitRecordUpdate, db: Session = Depends(get_db)):
    db_obj = crud.update_visit_record(db, id, obj)
    if not db_obj:
        raise HTTPException(status_code=404, detail="回访记录不存在")
    return db_obj


@router.post("/batch-update")
def batch_update_visits(obj: schemas.BatchVisitUpdate, db: Session = Depends(get_db)):
    count = crud.batch_update_visit_records(
        db, obj.ids, status=obj.status, visitor=obj.visitor
    )
    return {"updated": count}
