from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, crud, models

router = APIRouter(prefix="/api/lens-transfers", tags=["镜片调拨"])


@router.post("", response_model=schemas.LensTransfer)
def create_transfer(obj: schemas.LensTransferCreate, db: Session = Depends(get_db)):
    if obj.repair_order_id:
        repair = crud.get_repair_order(db, obj.repair_order_id)
        if not repair:
            raise HTTPException(status_code=400, detail=f"关联的返修单ID {obj.repair_order_id} 不存在")
    return crud.create_lens_transfer(db, obj)


@router.get("", response_model=list[schemas.LensTransfer])
def list_transfers(
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    is_lost: int | None = None,
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
