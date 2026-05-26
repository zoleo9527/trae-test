from fastapi import APIRouter
from typing import List

from ..models import Complaint
from ..store import store

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.get("", response_model=List[Complaint])
def list_complaints() -> List[Complaint]:
    return sorted(store.complaints.values(), key=lambda c: c.created_at, reverse=True)
