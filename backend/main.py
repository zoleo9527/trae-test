from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from models import User, Plot, LiftingOrder, LoadingCheck, ExceptionRecord, AuditLog
from routers import auth, plots, orders, loading, exceptions, dashboard, audit
from seed import seed_data

app = FastAPI(title="苗木基地管理系统", description="起苗排单与装车复核管理系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

seed_data()

app.include_router(auth.router)
app.include_router(plots.router)
app.include_router(orders.router)
app.include_router(loading.router)
app.include_router(exceptions.router)
app.include_router(dashboard.router)
app.include_router(audit.router)


@app.get("/")
def root():
    return {"message": "苗木基地管理系统 API"}
