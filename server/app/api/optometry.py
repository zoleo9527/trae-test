from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from app.database import get_db
from app import schemas, crud, models

router = APIRouter(prefix="/api/optometry", tags=["验光单"])


@router.post("", response_model=schemas.OptometryOrder)
def create_optometry_order(obj: schemas.OptometryOrderCreate, db: Session = Depends(get_db)):
    existing = crud.get_optometry_order_by_no(db, obj.order_no)
    if existing:
        raise HTTPException(status_code=400, detail="验光单号已存在")
    return crud.create_optometry_order(db, obj)


@router.get("", response_model=List[schemas.OptometryOrder])
def list_optometry_orders(
    skip: int = 0,
    limit: int = 100,
    keyword: Optional[str] = None,
    store: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return crud.get_optometry_orders(db, skip=skip, limit=limit, keyword=keyword, store=store)


@router.get("/{id}", response_model=schemas.OptometryOrder)
def get_optometry_order(id: int, db: Session = Depends(get_db)):
    obj = crud.get_optometry_order(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="验光单不存在")
    return obj


@router.put("/{id}", response_model=schemas.OptometryOrder)
def update_optometry_order(id: int, obj: schemas.OptometryOrderUpdate, db: Session = Depends(get_db)):
    db_obj = crud.get_optometry_order(db, id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="验光单不存在")
    update_data = obj.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj
