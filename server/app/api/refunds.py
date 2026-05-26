from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app import schemas, crud

router = APIRouter(prefix="/api/refunds", tags=["退款记录"])


@router.post("", response_model=schemas.RefundRecord)
def create_refund(obj: schemas.RefundRecordCreate, db: Session = Depends(get_db)):
    return crud.create_refund_record(db, obj)


@router.get("", response_model=List[schemas.RefundRecord])
def list_refunds(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return crud.get_refund_records(db, skip=skip, limit=limit, status=status)


@router.get("/{id}", response_model=schemas.RefundRecord)
def get_refund(id: int, db: Session = Depends(get_db)):
    obj = crud.get_refund_record(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="退款记录不存在")
    return obj


@router.put("/{id}", response_model=schemas.RefundRecord)
def update_refund(id: int, obj: schemas.RefundRecordUpdate, db: Session = Depends(get_db)):
    db_obj = crud.update_refund_record(db, id, obj)
    if not db_obj:
        raise HTTPException(status_code=404, detail="退款记录不存在")
    return db_obj
