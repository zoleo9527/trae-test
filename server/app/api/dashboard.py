from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud

router = APIRouter(prefix="/api/dashboard", tags=["首页看板"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)


@router.get("/stores")
def get_stores(db: Session = Depends(get_db)):
    return crud.get_stores(db)


@router.get("/repair-types")
def get_repair_types(db: Session = Depends(get_db)):
    return crud.get_repair_types(db)
