from fastapi import APIRouter

from . import coaches, complaints, courses, dashboard, leaves, members, water_quality

api_router = APIRouter()
api_router.include_router(dashboard.router)
api_router.include_router(coaches.router)
api_router.include_router(members.router)
api_router.include_router(courses.router)
api_router.include_router(leaves.router)
api_router.include_router(water_quality.router)
api_router.include_router(complaints.router)
