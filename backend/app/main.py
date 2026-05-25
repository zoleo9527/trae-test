from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.routers import auth, base, purchases, gradings, allocations, sales, exceptions, review
from app.seed import seed_all

Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    seed_all(db)
finally:
    db.close()

app = FastAPI(title="水果批发 - 进货分级与档口配货")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(base.router)
app.include_router(purchases.router)
app.include_router(gradings.router)
app.include_router(allocations.router)
app.include_router(sales.router)
app.include_router(exceptions.router)
app.include_router(review.router)


@app.get("/api/health")
def health():
    return {"ok": True}
