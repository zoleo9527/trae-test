from __future__ import annotations

from datetime import date, datetime, time
from typing import Dict, List

from .models import (
    ActivityItem,
    Coach,
    CoachStatus,
    Complaint,
    Course,
    CourseStatus,
    DashboardResponse,
    DashboardStats,
    LeaveRequest,
    LeaveStatus,
    LeaveType,
    Member,
    Rectification,
    Recheck,
    RecheckStatus,
    StoredValueRecord,
    WaterInspection,
    InspectionStatus,
    WaterReading,
)


class Store:
    """In-memory store for all entities. Seeded on first load."""

    def __init__(self) -> None:
        self.coaches: Dict[str, Coach] = {}
        self.members: Dict[str, Member] = {}
        self.courses: Dict[str, Course] = {}
        self.leave_requests: Dict[str, LeaveRequest] = {}
        self.inspections: Dict[str, WaterInspection] = {}
        self.rectifications: Dict[str, Rectification] = {}
        self.rechecks: Dict[str, Recheck] = {}
        self.complaints: Dict[str, Complaint] = {}
        self.stored_value: Dict[str, StoredValueRecord] = {}
        self._seed()

    # ---------- Seed ----------

    def _seed(self) -> None:
        c1 = Coach(name="张教练", title="主教练", status=CoachStatus.active, phone="13800000001")
        c2 = Coach(name="李教练", title="助理教练", status=CoachStatus.active, phone="13800000002")
        c3 = Coach(name="王教练", title="教练", status=CoachStatus.leave, phone="13800000003")
        for c in (c1, c2, c3):
            self.coaches[c.id] = c

        m1 = Member(name="小明", phone="13911110001", balance=1280.0, total_sessions=20, used_sessions=8)
        m2 = Member(name="小红", phone="13911110002", balance=640.0, total_sessions=10, used_sessions=10)
        m3 = Member(name="小刚", phone="13911110003", balance=2560.0, total_sessions=40, used_sessions=12)
        for m in (m1, m2, m3):
            self.members[m.id] = m

        sv1 = StoredValueRecord(member_id=m1.id, amount=1280.0, type="recharge", note="首次办卡20节")
        sv2 = StoredValueRecord(member_id=m2.id, amount=640.0, type="consume", note="请假消课 2 节")
        sv3 = StoredValueRecord(member_id=m3.id, amount=2560.0, type="recharge", note="续卡40节")
        for sv in (sv1, sv2, sv3):
            self.stored_value[sv.id] = sv

        today = date.today()
        courses = [
            Course(title="少儿蛙泳基础班", coach_id=c1.id, date=today,
                   start_time=time(9, 0), end_time=time(10, 0),
                   capacity=8, enrolled=6, status=CourseStatus.scheduled),
            Course(title="成人自由泳提高班", coach_id=c2.id, date=today,
                   start_time=time(18, 30), end_time=time(19, 30),
                   capacity=6, enrolled=5, status=CourseStatus.scheduled),
            Course(title="亲子水上活动", coach_id=c1.id, date=today,
                   start_time=time(16, 0), end_time=time(17, 0),
                   capacity=10, enrolled=10, status=CourseStatus.completed, note="已完成"),
        ]
        for course in courses:
            self.courses[course.id] = course

        lv_pending = LeaveRequest(
            coach_id=c3.id, type=LeaveType.sick,
            start_date=today, end_date=today,
            reason="感冒发烧，请假一天", substitute_coach_id=c2.id,
            status=LeaveStatus.pending,
        )
        lv_rejected = LeaveRequest(
            coach_id=c2.id, type=LeaveType.personal,
            start_date=today, end_date=today,
            reason="家中有事", substitute_coach_id=c1.id,
            status=LeaveStatus.rejected, reviewer="馆长",
            review_note="今日课程密集，无法安排顶替，请改期",
            reviewed_at=datetime.now(),
        )
        for lv in (lv_pending, lv_rejected):
            self.leave_requests[lv.id] = lv

        insp = WaterInspection(
            pool_name="主泳池", inspector="张教练",
            readings=[
                WaterReading(item=WaterItem.ph, value=7.6, unit="", normal_range="6.8-8.2"),
                WaterReading(item=WaterItem.residual_chlorine, value=0.2, unit="mg/L",
                             normal_range="0.3-0.5", is_abnormal=True),
                WaterReading(item=WaterItem.turbidity, value=0.8, unit="NTU", normal_range="≤1.0"),
                WaterReading(item=WaterItem.temperature, value=26.5, unit="℃", normal_range="25-28"),
            ],
            photo_urls=["https://picsum.photos/seed/pool-a/800/600"],
            status=InspectionStatus.abnormal,
            remark="余氯偏低，需加药",
        )
        self.inspections[insp.id] = insp

        rect = Rectification(
            inspection_id=insp.id, owner="李教练",
            issue_summary="余氯偏低(0.2mg/L)，低于标准下限",
            measures=["加氯片10片", "循环2小时", "30分钟后复测"],
            due_date=today,
            status="recheck_pending",
        )
        self.rectifications[rect.id] = rect
        insp.rectification_id = rect.id
        insp.status = InspectionStatus.recheck_pending

        insp2 = WaterInspection(
            pool_name="儿童池", inspector="王教练",
            readings=[
                WaterReading(item=WaterItem.ph, value=7.4, unit="", normal_range="6.8-8.2"),
                WaterReading(item=WaterItem.residual_chlorine, value=0.4, unit="mg/L", normal_range="0.3-0.5"),
            ],
            photo_urls=["https://picsum.photos/seed/pool-b/800/600"],
            status=InspectionStatus.recorded,
        )
        self.inspections[insp2.id] = insp2

        recheck = Recheck(
            rectification_id=rect.id, rechecker="张教练",
            readings=[],
            photo_urls=[],
            status=RecheckStatus.pending,
        )
        self.rechecks[recheck.id] = recheck

        cmp = Complaint(
            member_id=m1.id, title="消课记录有误",
            content="请假后依然被扣了2节课，请核实",
            status="processing", handler="前台客服",
        )
        self.complaints[cmp.id] = cmp

    # ---------- Dashboard ----------

    def dashboard(self) -> DashboardResponse:
        today = date.today()
        stats = DashboardStats(
            pending_leaves=sum(1 for lv in self.leave_requests.values() if lv.status == LeaveStatus.pending),
            rejected_leaves=sum(1 for lv in self.leave_requests.values() if lv.status == LeaveStatus.rejected),
            recheck_pending=sum(1 for r in self.rechecks.values() if r.status == RecheckStatus.pending),
            abnormal_inspections=sum(
                1 for i in self.inspections.values()
                if i.status in (InspectionStatus.abnormal, InspectionStatus.rectifying, InspectionStatus.recheck_pending)
            ),
            today_courses=sum(1 for c in self.courses.values() if c.date == today),
            open_complaints=sum(1 for c in self.complaints.values() if c.status != "closed"),
            pending_rectifications=sum(1 for r in self.rectifications.values() if r.status != "closed"),
        )

        activities: List[ActivityItem] = []
        for lv in self.leave_requests.values():
            coach = self.coaches.get(lv.coach_id)
            activities.append(ActivityItem(
                id=lv.id, kind="leave",
                title=f"{coach.name if coach else '教练'} 请假申请",
                status=lv.status.value, time=lv.created_at,
            ))
        for insp in self.inspections.values():
            activities.append(ActivityItem(
                id=insp.id, kind="inspection",
                title=f"{insp.pool_name} 水质巡检",
                status=insp.status.value, time=insp.inspected_at,
            ))
        for rect in self.rectifications.values():
            activities.append(ActivityItem(
                id=rect.id, kind="rectification",
                title=f"整改:{rect.issue_summary}",
                status=rect.status, time=rect.created_at,
            ))
        for rc in self.rechecks.values():
            activities.append(ActivityItem(
                id=rc.id, kind="recheck",
                title=f"回查 整改{rc.rectification_id[:6]}",
                status=rc.status.value, time=rc.rechecked_at or datetime.now(),
            ))
        for cmp in self.complaints.values():
            activities.append(ActivityItem(
                id=cmp.id, kind="complaint",
                title=f"投诉:{cmp.title}",
                status=cmp.status, time=cmp.created_at,
            ))
        activities.sort(key=lambda a: a.time, reverse=True)
        return DashboardResponse(stats=stats, activities=activities[:20])


store = Store()
