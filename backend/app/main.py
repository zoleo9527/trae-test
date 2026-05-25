from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from .database import engine, get_db, Base
from . import models, schemas, crud

Base.metadata.create_all(bind=engine)

app = FastAPI(title="美术馆运营系统", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)


@app.get("/api/dashboard/pending-items")
def get_pending_items(db: Session = Depends(get_db)):
    return crud.get_pending_items(db)


@app.post("/api/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db=db, user=user)


@app.get("/api/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_users(db, skip=skip, limit=limit)


@app.get("/api/users/volunteers", response_model=List[schemas.User])
def read_volunteers(db: Session = Depends(get_db)):
    return crud.get_volunteers(db)


@app.get("/api/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.post("/api/schedules/", response_model=schemas.VolunteerSchedule)
def create_schedule(schedule: schemas.VolunteerScheduleCreate, db: Session = Depends(get_db)):
    return crud.create_schedule(db=db, schedule=schedule)


@app.get("/api/schedules/", response_model=List[schemas.VolunteerSchedule])
def read_schedules(
    skip: int = 0,
    limit: int = 100,
    status: Optional[schemas.ScheduleStatus] = None,
    volunteer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return crud.get_schedules(db, skip=skip, limit=limit, status=status, volunteer_id=volunteer_id)


@app.get("/api/schedules/{schedule_id}", response_model=schemas.VolunteerSchedule)
def read_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = crud.get_schedule(db, schedule_id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return db_schedule


@app.put("/api/schedules/{schedule_id}", response_model=schemas.VolunteerSchedule)
def update_schedule(
    schedule_id: int,
    schedule_update: schemas.VolunteerScheduleUpdate,
    db: Session = Depends(get_db)
):
    return crud.update_schedule(db, schedule_id=schedule_id, schedule_update=schedule_update)


@app.post("/api/feedbacks/", response_model=schemas.Feedback)
def create_feedback(feedback: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    return crud.create_feedback(db=db, feedback=feedback)


@app.get("/api/feedbacks/", response_model=List[schemas.Feedback])
def read_feedbacks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[schemas.FeedbackStatus] = None,
    feedback_type: Optional[schemas.FeedbackType] = None,
    needs_review: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    return crud.get_feedbacks(db, skip=skip, limit=limit, status=status, feedback_type=feedback_type, needs_review=needs_review)


@app.get("/api/feedbacks/{feedback_id}", response_model=schemas.Feedback)
def read_feedback(feedback_id: int, db: Session = Depends(get_db)):
    db_feedback = crud.get_feedback(db, feedback_id=feedback_id)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return db_feedback


@app.put("/api/feedbacks/{feedback_id}", response_model=schemas.Feedback)
def update_feedback(
    feedback_id: int,
    feedback_update: schemas.FeedbackUpdate,
    db: Session = Depends(get_db)
):
    return crud.update_feedback(db, feedback_id=feedback_id, feedback_update=feedback_update)


@app.post("/api/review-traces/", response_model=schemas.ReviewTrace)
def create_review_trace(trace: schemas.ReviewTraceCreate, db: Session = Depends(get_db)):
    return crud.create_review_trace(db=db, trace=trace)


@app.get("/api/feedbacks/{feedback_id}/traces", response_model=List[schemas.ReviewTrace])
def read_feedback_traces(feedback_id: int, db: Session = Depends(get_db)):
    return crud.get_feedback_traces(db, feedback_id=feedback_id)


@app.post("/api/exhibits/", response_model=schemas.Exhibit)
def create_exhibit(exhibit: schemas.ExhibitCreate, db: Session = Depends(get_db)):
    return crud.create_exhibit(db=db, exhibit=exhibit)


@app.get("/api/exhibits/", response_model=List[schemas.Exhibit])
def read_exhibits(
    skip: int = 0,
    limit: int = 100,
    status: Optional[schemas.ExhibitStatus] = None,
    db: Session = Depends(get_db)
):
    return crud.get_exhibits(db, skip=skip, limit=limit, status=status)


@app.get("/api/exhibits/{exhibit_id}", response_model=schemas.Exhibit)
def read_exhibit(exhibit_id: int, db: Session = Depends(get_db)):
    db_exhibit = crud.get_exhibit(db, exhibit_id=exhibit_id)
    if db_exhibit is None:
        raise HTTPException(status_code=404, detail="Exhibit not found")
    return db_exhibit


@app.post("/api/exhibit-transfers/", response_model=schemas.ExhibitTransfer)
def create_exhibit_transfer(transfer: schemas.ExhibitTransferCreate, db: Session = Depends(get_db)):
    return crud.create_exhibit_transfer(db=db, transfer=transfer)


@app.get("/api/exhibit-transfers/", response_model=List[schemas.ExhibitTransfer])
def read_exhibit_transfers(
    skip: int = 0,
    limit: int = 100,
    confirmed: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    return crud.get_exhibit_transfers(db, skip=skip, limit=limit, confirmed=confirmed)


@app.put("/api/exhibit-transfers/{transfer_id}/confirm", response_model=schemas.ExhibitTransfer)
def confirm_transfer(transfer_id: int, db: Session = Depends(get_db)):
    return crud.confirm_exhibit_transfer(db, transfer_id=transfer_id)


@app.post("/api/activities/", response_model=schemas.Activity)
def create_activity(activity: schemas.ActivityCreate, db: Session = Depends(get_db)):
    return crud.create_activity(db=db, activity=activity)


@app.get("/api/activities/", response_model=List[schemas.Activity])
def read_activities(
    skip: int = 0,
    limit: int = 100,
    status: Optional[schemas.ActivityStatus] = None,
    db: Session = Depends(get_db)
):
    return crud.get_activities(db, skip=skip, limit=limit, status=status)


@app.get("/api/activities/{activity_id}", response_model=schemas.Activity)
def read_activity(activity_id: int, db: Session = Depends(get_db)):
    db_activity = crud.get_activity(db, activity_id=activity_id)
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    return db_activity


@app.put("/api/activities/{activity_id}", response_model=schemas.Activity)
def update_activity(
    activity_id: int,
    activity_update: schemas.ActivityUpdate,
    db: Session = Depends(get_db)
):
    return crud.update_activity(db, activity_id=activity_id, activity_update=activity_update)


@app.post("/api/tickets/", response_model=schemas.Ticket)
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
    return crud.create_ticket(db=db, ticket=ticket)


@app.get("/api/tickets/", response_model=List[schemas.Ticket])
def read_tickets(
    skip: int = 0,
    limit: int = 100,
    activity_id: Optional[int] = None,
    verification_status: Optional[schemas.VerificationStatus] = None,
    db: Session = Depends(get_db)
):
    return crud.get_tickets(db, skip=skip, limit=limit, activity_id=activity_id, verification_status=verification_status)


@app.put("/api/tickets/{ticket_id}/verify", response_model=schemas.Ticket)
def verify_ticket(ticket_id: int, verified_by: str = "System", db: Session = Depends(get_db)):
    return crud.verify_ticket(db, ticket_id=ticket_id, verified_by=verified_by)


@app.put("/api/tickets/{ticket_id}/reject", response_model=schemas.Ticket)
def reject_ticket(ticket_id: int, verified_by: str = "System", db: Session = Depends(get_db)):
    return crud.reject_ticket(db, ticket_id=ticket_id, verified_by=verified_by)
