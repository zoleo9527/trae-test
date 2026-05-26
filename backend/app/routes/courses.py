from datetime import date
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from ..models import Course, CourseIn, CourseUpdate, CourseStatus
from ..store import store

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=List[Course])
def list_courses(on_date: Optional[date] = Query(None)) -> List[Course]:
    items = list(store.courses.values())
    if on_date:
        items = [c for c in items if c.date == on_date]
    items.sort(key=lambda c: (c.date, c.start_time))
    return items


@router.post("", response_model=Course)
def create_course(payload: CourseIn) -> Course:
    course = Course(**payload.model_dump())
    store.courses[course.id] = course
    return course


@router.get("/{course_id}", response_model=Course)
def get_course(course_id: str) -> Course:
    c = store.courses.get(course_id)
    if not c:
        raise HTTPException(status_code=404, detail="课程不存在")
    return c


@router.patch("/{course_id}", response_model=Course)
def update_course(course_id: str, payload: CourseUpdate) -> Course:
    c = store.courses.get(course_id)
    if not c:
        raise HTTPException(status_code=404, detail="课程不存在")
    if payload.status is not None:
        c.status = payload.status
    if payload.note is not None:
        c.note = payload.note
    return c
