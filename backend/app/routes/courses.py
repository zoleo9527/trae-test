from datetime import date
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from ..models import Course, CourseIn, CourseUpdate, CourseStatus, StoredValueRecord
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

    is_consume_action = payload.status in (CourseStatus.leave, CourseStatus.cancelled)

    if is_consume_action:
        if not payload.member_id:
            raise HTTPException(status_code=400, detail="消课/取消操作必须指定会员")
        if payload.member_id not in store.members:
            raise HTTPException(status_code=404, detail="会员不存在")
        if c.consume_record_id:
            raise HTTPException(status_code=409, detail="该课程已生成过储值流水，不允许重复扣减")

    if payload.status is not None:
        c.status = payload.status
    if payload.note is not None:
        c.note = payload.note

    if is_consume_action:
        default_amount = 64.0
        if payload.status == CourseStatus.leave:
            note = payload.note or "请假消课"
            c.note = f"{note} · 已写入储值流水"
        else:
            note = payload.note or "课程取消"
            c.note = f"{note} · 已写入储值流水"

        amount = payload.consume_amount or default_amount
        sv = StoredValueRecord(
            member_id=payload.member_id,
            amount=amount,
            type="consume",
            note=f"{c.title} · {note}",
        )
        store.stored_value[sv.id] = sv
        member = store.members[payload.member_id]
        member.balance -= amount
        member.used_sessions += 1
        c.consume_record_id = sv.id
        c.consumed_member_id = payload.member_id

    return c
