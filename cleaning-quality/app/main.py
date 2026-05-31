from __future__ import annotations
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import API_PREFIX
from app.database import engine, Base
from app.middleware.audit import AuditMiddleware
from app.routers import dashboard, project, schedule, inspection, rectification, consumable, contract
from app.services.state_machine import StateTransitionError, ConcurrentTransitionError
from app.services.idempotency import DuplicateSubmissionError, MissingIdempotencyKeyError


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


@app.exception_handler(StateTransitionError)
async def state_transition_handler(request: Request, exc: StateTransitionError):
    return JSONResponse(
        status_code=400,
        content={"error": "STATE_TRANSITION_ERROR", "detail": str(exc)},
    )


@app.exception_handler(ConcurrentTransitionError)
async def concurrent_transition_handler(request: Request, exc: ConcurrentTransitionError):
    return JSONResponse(
        status_code=409,
        content={"error": "CONCURRENT_CONFLICT", "detail": str(exc)},
    )


@app.exception_handler(DuplicateSubmissionError)
async def duplicate_submission_handler(request: Request, exc: DuplicateSubmissionError):
    return JSONResponse(
        status_code=409,
        content={"error": "DUPLICATE_SUBMISSION", "detail": str(exc)},
    )


@app.exception_handler(MissingIdempotencyKeyError)
async def missing_idempotency_key_handler(request: Request, exc: MissingIdempotencyKeyError):
    return JSONResponse(
        status_code=400,
        content={"error": "MISSING_IDEMPOTENCY_KEY", "detail": str(exc)},
    )


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
        "required_headers": {
            "all_write_endpoints": [
                "X-Operator-Id: 操作人ID",
                "X-Operator-Name: 操作人姓名",
                "X-Operator-Role: 操作人角色 (admin/project_manager/schedule_staff/inspector)",
            ],
            "create_endpoints": [
                "X-Idempotency-Key: 幂等键（必填，防止重复提交）",
            ],
            "status_transition_endpoints": [
                "X-Expected-Version: 预期版本号（必填，乐观锁并发控制）",
            ],
        },
    }
