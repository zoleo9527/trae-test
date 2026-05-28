from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import uuid4
import json
import os
import hashlib
from events import (
    event_register, event_status_update, event_exception_report,
    event_exception_resolve, event_rework, event_add_note,
)

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data.json")

app = FastAPI(title="胶卷冲扫管理系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password, hashed_password):
    return hash_password(plain_password) == hashed_password

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class User(BaseModel):
    username: str
    role: str
    full_name: str

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class FilmRoll(BaseModel):
    id: str
    registration_number: str
    customer_name: str
    customer_phone: str
    film_type: str
    film_brand: str
    iso: int
    frame_count: int
    development_type: str
    scan_resolution: str
    special_instructions: str
    status: str
    priority: str
    registered_at: str
    registered_by: str
    current_step: int
    estimated_delivery: str
    actual_delivery: Optional[str] = None
    amount: float
    paid: bool
    notes: List[Dict[str, Any]] = []
    history: List[Dict[str, Any]] = []
    exceptions: List[Dict[str, Any]] = []
    rework_count: int = 0
    tags: List[str] = []

class FilmRollCreate(BaseModel):
    customer_name: str
    customer_phone: str
    film_type: str
    film_brand: str
    iso: int
    frame_count: int
    development_type: str
    scan_resolution: str
    special_instructions: str = ""
    priority: str = "normal"
    amount: float
    paid: bool = False

class StatusUpdate(BaseModel):
    status: str
    current_step: int
    note: str
    operator: str

class ExceptionRecord(BaseModel):
    type: str
    description: str
    severity: str
    reported_by: str

class ReworkConfirm(BaseModel):
    reason: str
    confirmed_by: str
    rework_scope: str

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"users": {}, "film_rolls": [], "next_reg_num": 1000}

def save_data(data):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)



def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    data = load_data()
    user = data["users"].get(username)
    if user is None:
        raise credentials_exception
    return User(**user)

@app.on_event("startup")
def initialize_data():
    data = load_data()
    if not data["users"]:
        data["users"] = {
            "admin": {
                "username": "admin",
                "role": "admin",
                "full_name": "系统管理员",
                "hashed_password": hash_password("admin123")
            },
            "owner": {
                "username": "owner",
                "role": "owner",
                "full_name": "店主张三",
                "hashed_password": get_password_hash("owner123")
            },
            "tech": {
                "username": "tech",
                "role": "technician",
                "full_name": "冲印师李四",
                "hashed_password": get_password_hash("tech123")
            },
            "service": {
                "username": "service",
                "role": "service",
                "full_name": "客服小王",
                "hashed_password": get_password_hash("service123")
            }
        }
        save_data(data)

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    data = load_data()
    user_dict = data["users"].get(form_data.username)
    if not user_dict or not verify_password(form_data.password, user_dict["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = User(**user_dict)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.get("/api/film-rolls")
async def get_film_rolls(status: Optional[str] = None, search: Optional[str] = None, current_user: User = Depends(get_current_user)):
    data = load_data()
    rolls = data["film_rolls"]
    if status:
        rolls = [r for r in rolls if r["status"] == status]
    if search:
        search_lower = search.lower()
        rolls = [r for r in rolls if search_lower in r["registration_number"].lower() or 
                 search_lower in r["customer_name"].lower() or 
                 search_lower in r["customer_phone"]]
    return {"rolls": rolls}

@app.get("/api/film-rolls/{roll_id}")
async def get_film_roll(roll_id: str, current_user: User = Depends(get_current_user)):
    data = load_data()
    for roll in data["film_rolls"]:
        if roll["id"] == roll_id:
            return roll
    raise HTTPException(status_code=404, detail="Film roll not found")

@app.post("/api/film-rolls")
async def create_film_roll(roll_data: FilmRollCreate, current_user: User = Depends(get_current_user)):
    data = load_data()
    reg_num = f"F{data['next_reg_num']:06d}"
    data["next_reg_num"] += 1
    
    now = datetime.now().isoformat()
    estimated = (datetime.now() + timedelta(days=3)).isoformat()
    
    new_roll = {
        "id": str(uuid4()),
        "registration_number": reg_num,
        **roll_data.dict(),
        "status": "registered",
        "registered_at": now,
        "registered_by": current_user.full_name,
        "current_step": 0,
        "estimated_delivery": estimated,
        "notes": [],
        "history": [event_register(now, current_user.full_name, reg_num)],
        "exceptions": [],
        "rework_count": 0,
        "tags": []
    }
    data["film_rolls"].insert(0, new_roll)
    save_data(data)
    return new_roll

@app.patch("/api/film-rolls/{roll_id}/status")
async def update_status(roll_id: str, update: StatusUpdate, current_user: User = Depends(get_current_user)):
    data = load_data()
    for roll in data["film_rolls"]:
        if roll["id"] == roll_id:
            roll["status"] = update.status
            roll["current_step"] = update.current_step
            now = datetime.now().isoformat()
            roll["history"].append(event_status_update(now, update.operator, update.status))
            if update.status == "completed":
                roll["actual_delivery"] = datetime.now().isoformat()
            save_data(data)
            return roll
    raise HTTPException(status_code=404, detail="Film roll not found")

@app.post("/api/film-rolls/{roll_id}/exceptions")
async def add_exception(roll_id: str, exception: ExceptionRecord, current_user: User = Depends(get_current_user)):
    data = load_data()
    for roll in data["film_rolls"]:
        if roll["id"] == roll_id:
            now = datetime.now().isoformat()
            exception_record = {
                "id": str(uuid4()),
                **exception.dict(),
                "timestamp": now,
                "resolved": False,
                "resolution": None,
                "resolved_at": None,
                "resolved_by": None
            }
            roll["exceptions"].append(exception_record)
            roll["history"].append(event_exception_report(now, exception.reported_by, exception.type, exception.severity, exception.description))
            if "异常" not in roll["tags"]:
                roll["tags"].append("异常")
            save_data(data)
            return roll
    raise HTTPException(status_code=404, detail="Film roll not found")

@app.patch("/api/film-rolls/{roll_id}/exceptions/{exception_id}/resolve")
async def resolve_exception(roll_id: str, exception_id: str, resolution: Dict[str, str], current_user: User = Depends(get_current_user)):
    data = load_data()
    for roll in data["film_rolls"]:
        if roll["id"] == roll_id:
            for exc in roll["exceptions"]:
                if exc["id"] == exception_id:
                    exc["resolved"] = True
                    exc["resolution"] = resolution["resolution"]
                    now = datetime.now().isoformat()
                    exc["resolved_at"] = now
                    exc["resolved_by"] = resolution["resolved_by"]
                    roll["history"].append(event_exception_resolve(now, resolution["resolved_by"], resolution["resolution"]))
                    save_data(data)
                    return roll
    raise HTTPException(status_code=404, detail="Not found")

@app.post("/api/film-rolls/{roll_id}/rework")
async def request_rework(roll_id: str, rework: ReworkConfirm, current_user: User = Depends(get_current_user)):
    data = load_data()
    for roll in data["film_rolls"]:
        if roll["id"] == roll_id:
            roll["rework_count"] += 1
            roll["status"] = "rework"
            roll["current_step"] = 1
            now = datetime.now().isoformat()
            roll["history"].append(event_rework(now, rework.confirmed_by, rework.reason, rework.rework_scope))
            if "返工" not in roll["tags"]:
                roll["tags"].append("返工")
            save_data(data)
            return roll
    raise HTTPException(status_code=404, detail="Film roll not found")

@app.post("/api/film-rolls/{roll_id}/notes")
async def add_note(roll_id: str, note_data: Dict[str, str], current_user: User = Depends(get_current_user)):
    data = load_data()
    for roll in data["film_rolls"]:
        if roll["id"] == roll_id:
            now = datetime.now().isoformat()
            note = {
                "id": str(uuid4()),
                "content": note_data["content"],
                "author": note_data["author"],
                "timestamp": now,
                "type": note_data.get("type", "normal")
            }
            roll["notes"].append(note)
            roll["history"].append(event_add_note(now, note_data["author"], note_data["content"], note_data.get("type", "normal")))
            save_data(data)
            return roll
    raise HTTPException(status_code=404, detail="Film roll not found")

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    data = load_data()
    rolls = data["film_rolls"]
    
    status_counts = {}
    for roll in rolls:
        status = roll["status"]
        status_counts[status] = status_counts.get(status, 0) + 1
    
    today = datetime.now().date()
    today_count = sum(1 for r in rolls if datetime.fromisoformat(r["registered_at"]).date() == today)
    
    exception_count = sum(1 for r in rolls if any(not e.get("resolved") for e in r["exceptions"]))
    rework_count = sum(1 for r in rolls if r["rework_count"] > 0 and r["status"] == "rework")
    
    return {
        "total": len(rolls),
        "today_new": today_count,
        "status_counts": status_counts,
        "pending_exceptions": exception_count,
        "pending_rework": rework_count,
        "by_step": {
            "registered": sum(1 for r in rolls if r["current_step"] == 0),
            "developing": sum(1 for r in rolls if r["current_step"] == 1),
            "scanning": sum(1 for r in rolls if r["current_step"] == 2),
            "quality_check": sum(1 for r in rolls if r["current_step"] == 3),
            "completed": sum(1 for r in rolls if r["current_step"] == 4)
        }
    }

@app.get("/api/dashboard/timeline")
async def get_timeline(current_user: User = Depends(get_current_user)):
    data = load_data()
    all_events = []
    for roll in data["film_rolls"]:
        for event in roll["history"]:
            all_events.append({
                "roll_id": roll["id"],
                "registration_number": roll["registration_number"],
                "customer_name": roll["customer_name"],
                **event
            })
    all_events.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"events": all_events[:50]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
