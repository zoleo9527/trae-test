from __future__ import annotations
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import API_PREFIX
from app.database import engine, Base
from app.middleware.audit import AuditMiddleware
from app.routers import dashboard, project, schedule, inspection, rectification, consumable, contract


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="商用清洁 - 质检抽查与整改闭环",
    description="项目排班、质检抽查、整改闭环、耗材补货、续约回访 一体化管理系统",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuditMiddleware)

app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(project.router, prefix=API_PREFIX)
app.include_router(schedule.router, prefix=API_PREFIX)
app.include_router(inspection.router, prefix=API_PREFIX)
app.include_router(rectification.router, prefix=API_PREFIX)
app.include_router(consumable.router, prefix=API_PREFIX)
app.include_router(contract.router, prefix=API_PREFIX)


@app.get("/")
def root():
    return {
        "service": "商用清洁-质检抽查与整改闭环",
        "docs": "/docs",
        "api_prefix": API_PREFIX,
    }
