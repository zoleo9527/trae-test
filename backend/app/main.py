from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, projects, diaries, inspections, teams, settlements, deliveries, dashboard, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="地坪施工工地进度与质量复查系统", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(diaries.router)
app.include_router(inspections.router)
app.include_router(teams.router)
app.include_router(settlements.router)
app.include_router(deliveries.router)
app.include_router(dashboard.router)
app.include_router(users.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "地坪施工管理系统后端运行正常"}
