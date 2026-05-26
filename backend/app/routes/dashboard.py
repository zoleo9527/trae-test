from fastapi import APIRouter

from ..models import DashboardResponse
from ..store import store

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard() -> DashboardResponse:
    return store.dashboard()
