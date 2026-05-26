from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import optometry, repairs, lens_transfers, refunds, visits, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="眼镜连锁-售后返修与回访提醒系统",
    description="管理验光单、售后返修、镜片调拨、退款记录与回访提醒的全流程系统",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(optometry.router)
app.include_router(repairs.router)
app.include_router(lens_transfers.router)
app.include_router(refunds.router)
app.include_router(visits.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "系统运行正常"}
