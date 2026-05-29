from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Plot
from schemas import PlotCreate, PlotUpdate, PlotResponse

router = APIRouter(prefix="/api/plots", tags=["plots"])


@router.get("", response_model=list[PlotResponse])
def list_plots(db: Session = Depends(get_db)):
    return db.query(Plot).all()


@router.post("", response_model=PlotResponse)
def create_plot(data: PlotCreate, db: Session = Depends(get_db)):
    plot = Plot(**data.model_dump())
    db.add(plot)
    db.commit()
    db.refresh(plot)
    return plot


@router.get("/{plot_id}", response_model=PlotResponse)
def get_plot(plot_id: int, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="地块不存在")
    return plot


@router.put("/{plot_id}", response_model=PlotResponse)
def update_plot(plot_id: int, data: PlotUpdate, db: Session = Depends(get_db)):
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="地块不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(plot, key, value)
    db.commit()
    db.refresh(plot)
    return plot
