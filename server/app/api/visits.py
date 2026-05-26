from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from app.database import get_db
from app import schemas, crud

router = APIRouter(prefix="/api/visits", tags=["回访记录"])


@router.post("", response_model=schemas.VisitRecord)
def create_visit(obj: schemas.VisitRecordCreate, db: Session = Depends(get_db)):
    return crud.create_visit_record(db, obj)


@router.get("", response_model=List[schemas.VisitRecord])
def list_visits(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
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
