from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, berths, crew, checkpoints, payments, communications, audit, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="船舶代理-船员换班与截点提醒系统",
    description="船舶代理业务管理系统：靠泊计划、船员换班、截点提醒、垫付款项、供应商沟通记录一体化管理",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(berths.router, prefix="/api")
app.include_router(crew.router, prefix="/api")
app.include_router(checkpoints.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(communications.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "船舶代理-船员换班与截点提醒系统",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
