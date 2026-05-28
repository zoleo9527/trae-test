from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, crud
from app.auth import get_current_active_user

router = APIRouter(prefix="/communications", tags=["沟通记录"])


@router.get("/", response_model=List[schemas.Communication])
def read_communications(
    skip: int = 0,
    limit: int = 100,
    berth_plan_id: Optional[int] = None,
    crew_change_id: Optional[int] = None,
    payment_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    comms = crud.get_communications(
        db, skip=skip, limit=limit,
        berth_plan_id=berth_plan_id,
        crew_change_id=crew_change_id,
        payment_id=payment_id
    )
    return comms


@router.post("/", response_model=schemas.Communication, status_code=status.HTTP_201_CREATED)
def create_communication(
    comm: schemas.CommunicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.create_communication(db, comm=comm)
