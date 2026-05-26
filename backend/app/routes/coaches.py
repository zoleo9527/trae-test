from fastapi import APIRouter, HTTPException
from typing import List, Optional

from ..models import Coach, CoachIn, CoachStatus
from ..store import store

router = APIRouter(prefix="/coaches", tags=["coaches"])


@router.get("", response_model=List[Coach])
def list_coaches(status: Optional[CoachStatus] = None) -> List[Coach]:
    items = list(store.coaches.values())
    if status:
        items = [c for c in items if c.status == status]
    return items


@router.post("", response_model=Coach)
def create_coach(payload: CoachIn) -> Coach:
    coach = Coach(**payload.model_dump())
    store.coaches[coach.id] = coach
    return coach


@router.get("/{coach_id}", response_model=Coach)
def get_coach(coach_id: str) -> Coach:
    coach = store.coaches.get(coach_id)
    if not coach:
        raise HTTPException(status_code=404, detail="教练不存在")
    return coach


@router.patch("/{coach_id}", response_model=Coach)
def update_coach(coach_id: str, payload: CoachIn) -> Coach:
    coach = store.coaches.get(coach_id)
    if not coach:
        raise HTTPException(status_code=404, detail="教练不存在")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(coach, k, v)
    return coach
