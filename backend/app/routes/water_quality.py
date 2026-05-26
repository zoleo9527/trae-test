from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from ..models import (
    InspectionStatus,
    Rectification,
    RectificationIn,
    Recheck,
    RecheckIn,
    RecheckStatus,
    WaterInspection,
    WaterInspectionIn,
)
from ..store import store
from datetime import datetime

router = APIRouter(tags=["water-quality"])


# ---------- Inspections ----------


@router.get("/inspections", response_model=List[WaterInspection])
def list_inspections(status: Optional[InspectionStatus] = Query(None)) -> List[WaterInspection]:
    items = list(store.inspections.values())
    if status:
        items = [i for i in items if i.status == status]
    items.sort(key=lambda i: i.inspected_at, reverse=True)
    return items


@router.post("/inspections", response_model=WaterInspection)
def create_inspection(payload: WaterInspectionIn) -> WaterInspection:
    has_abnormal = any(r.is_abnormal for r in payload.readings)
    insp = WaterInspection(
        **payload.model_dump(),
        status=InspectionStatus.abnormal if has_abnormal else InspectionStatus.recorded,
    )
    store.inspections[insp.id] = insp
    return insp


@router.get("/inspections/{inspection_id}", response_model=WaterInspection)
def get_inspection(inspection_id: str) -> WaterInspection:
    insp = store.inspections.get(inspection_id)
    if not insp:
        raise HTTPException(status_code=404, detail="巡检记录不存在")
    return insp


@router.post("/inspections/{inspection_id}/rectify", response_model=Rectification)
def create_rectification(inspection_id: str, payload: RectificationIn) -> Rectification:
    insp = store.inspections.get(inspection_id)
    if not insp:
        raise HTTPException(status_code=404, detail="巡检记录不存在")
    rect = Rectification(**payload.model_dump())
    store.rectifications[rect.id] = rect
    insp.rectification_id = rect.id
    insp.status = InspectionStatus.rectifying
    return rect


# ---------- Rectifications ----------


@router.get("/rectifications", response_model=List[Rectification])
def list_rectifications(status: Optional[str] = Query(None)) -> List[Rectification]:
    items = list(store.rectifications.values())
    if status:
        items = [r for r in items if r.status == status]
    items.sort(key=lambda r: r.created_at, reverse=True)
    return items


@router.get("/rectifications/{rect_id}", response_model=Rectification)
def get_rectification(rect_id: str) -> Rectification:
    r = store.rectifications.get(rect_id)
    if not r:
        raise HTTPException(status_code=404, detail="整改记录不存在")
    return r


@router.post("/rectifications/{rect_id}/submit", response_model=Rectification)
def submit_rectification(rect_id: str) -> Rectification:
    r = store.rectifications.get(rect_id)
    if not r:
        raise HTTPException(status_code=404, detail="整改记录不存在")
    r.status = "recheck_pending"
    insp = next((i for i in store.inspections.values() if i.rectification_id == rect_id), None)
    if insp:
        insp.status = InspectionStatus.recheck_pending
    return r


# ---------- Rechecks ----------


@router.get("/rechecks", response_model=List[Recheck])
def list_rechecks(status: Optional[RecheckStatus] = Query(None)) -> List[Recheck]:
    items = list(store.rechecks.values())
    if status:
        items = [r for r in items if r.status == status]
    return items


@router.post("/rechecks", response_model=Recheck)
def create_recheck(payload: RecheckIn) -> Recheck:
    rc = Recheck(**payload.model_dump(), rechecked_at=datetime.now())
    store.rechecks[rc.id] = rc
    if rc.status == RecheckStatus.passed:
        rect = store.rectifications.get(rc.rectification_id)
        if rect:
            rect.status = "closed"
        insp = next((i for i in store.inspections.values() if i.rectification_id == rc.rectification_id), None)
        if insp:
            insp.status = InspectionStatus.recheck_passed
    return rc


@router.get("/rechecks/{recheck_id}", response_model=Recheck)
def get_recheck(recheck_id: str) -> Recheck:
    rc = store.rechecks.get(recheck_id)
    if not rc:
        raise HTTPException(status_code=404, detail="回查记录不存在")
    return rc
