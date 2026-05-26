from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, Base, get_db
from app.api import orders, configs, arrivals, installations, samples, replacements, repairs, auth
from app import models
from app.seed import seed_database

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="家具展厅-订单配置与到货跟踪",
    description="完整订单配置、到货跟踪、安装预约、样品借出、补件确认处理链",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(orders.router, prefix="/api/orders", tags=["订单"])
app.include_router(configs.router, prefix="/api/orders", tags=["配置"])
app.include_router(arrivals.router, prefix="/api/orders", tags=["到货"])
app.include_router(installations.router, prefix="/api/orders", tags=["安装预约"])
app.include_router(samples.router, prefix="/api/orders", tags=["样品借出"])
app.include_router(replacements.router, prefix="/api/orders", tags=["补件"])
app.include_router(repairs.router, prefix="/api/orders", tags=["售后"])


@app.on_event("startup")
def on_startup():
    db = Session(bind=engine)
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "furniture-showroom-backend"}