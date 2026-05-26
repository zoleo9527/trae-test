from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app import schemas, crud

router = APIRouter(prefix="/api/lens-transfers", tags=["镜片调拨"])


@router.post("", response_model=schemas.LensTransfer)
def create_transfer(obj: schemas.LensTransferCreate, db: Session = Depends(get_db)):
    return crud.create_lens_transfer(db, obj)


@router.get("", response_model=List[schemas.LensTransfer])
def list_transfers(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    is_lost: Optional[int] = None,
    db: Session = Depends(get_db),
):
    return crud.get_lens_transfers(db, skip=skip, limit=limit, status=status, is_lost=is_lost)


@router.get("/{id}", response_model=schemas.LensTransfer)
def get_transfer(id: int, db: Session = Depends(get_db)):
    obj = crud.get_lens_transfer(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="调拨记录不存在")
    return obj


@router.put("/{id}", response_model=schemas.LensTransfer)
def update_transfer(id: int, obj: schemas.LensTransferUpdate, db: Session = Depends(get_db)):
    db_obj = crud.update_lens_transfer(db, id, obj)
    if not db_obj:
        raise HTTPException(status_code=404, detail="调拨记录不存在")
    return db_obj
