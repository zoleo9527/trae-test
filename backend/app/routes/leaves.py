from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from ..models import LeaveRequest, LeaveRequestIn, LeaveReviewIn, LeaveStatus
from ..store import store
from datetime import datetime

router = APIRouter(prefix="/leaves", tags=["leaves"])


@router.get("", response_model=List[LeaveRequest])
def list_leaves(status: Optional[LeaveStatus] = Query(None)) -> List[LeaveRequest]:
    items = list(store.leave_requests.values())
    if status:
        items = [lv for lv in items if lv.status == status]
    items.sort(key=lambda lv: lv.created_at, reverse=True)
    return items


@router.post("", response_model=LeaveRequest)
def create_leave(payload: LeaveRequestIn) -> LeaveRequest:
    lv = LeaveRequest(**payload.model_dump())
    store.leave_requests[lv.id] = lv
    return lv


@router.get("/{leave_id}", response_model=LeaveRequest)
def get_leave(leave_id: str) -> LeaveRequest:
    lv = store.leave_requests.get(leave_id)
    if not lv:
        raise HTTPException(status_code=404, detail="请假申请不存在")
    return lv


@router.post("/{leave_id}/review", response_model=LeaveRequest)
def review_leave(leave_id: str, payload: LeaveReviewIn) -> LeaveRequest:
    lv = store.leave_requests.get(leave_id)
    if not lv:
        raise HTTPException(status_code=404, detail="请假申请不存在")
    lv.status = payload.status
    lv.reviewer = payload.reviewer
    lv.review_note = payload.review_note
    lv.reviewed_at = datetime.now()
    return lv
