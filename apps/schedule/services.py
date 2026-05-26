from django.db import models
from django.db.models import Q, Count, F
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Course, Student, Schedule, Enrollment
from apps.core.exceptions import ValidationException, StatusConflictException, ResourceNotFoundException
from apps.core.services import AuditService
from apps.core.models_audit import AuditLog


class CourseService:
    @staticmethod
    def list_courses(course_type=None, level=None, is_active=None, search=None):
        queryset = Course.objects.all()
        if course_type:
            queryset = queryset.filter(course_type=course_type)
        if level:
            queryset = queryset.filter(level=level)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset.annotate(
            schedule_count=Count('schedules')
        )

    @staticmethod
    def create_course(user, **kwargs):
        course = Course.objects.create(**kwargs)
        AuditService.log_action(
            user=user,
            action=AuditLog.Action.CREATE,
            instance=course,
            new_value=kwargs
        )
        return course

    @staticmethod
    def update_course(user, course, **kwargs):
        for key, value in kwargs.items():
            setattr(course, key, value)
        course.save()
        return course


class StudentService:
    @staticmethod
    def list_students(gender=None, is_active=None, swim_level=None, search=None):
        queryset = Student.objects.all()
        if gender:
            queryset = queryset.filter(gender=gender)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        if swim_level:
            queryset = queryset.filter(swim_level=swim_level)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search)
            )
        return queryset.annotate(
            enrollment_count=Count('enrollments')
        )

    @staticmethod
    def create_student(user, **kwargs):
        student = Student.objects.create(**kwargs)
        AuditService.log_action(
            user=user,
            action=AuditLog.Action.CREATE,
            instance=student,
            new_value=kwargs
        )
        return student


class ScheduleService:
    @staticmethod
    def list_schedules(course_id=None, coach_id=None, status=None, start_date=None, end_date=None, search=None):
        queryset = Schedule.objects.select_related('course', 'coach').all()
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if coach_id:
            queryset = queryset.filter(coach_id=coach_id)
        if status:
            queryset = queryset.filter(status=status)
        if start_date:
            queryset = queryset.filter(start_time__gte=start_date)
        if end_date:
            queryset = queryset.filter(start_time__lte=end_date + timedelta(days=1))
        if search:
            queryset = queryset.filter(
                Q(course__name__icontains=search) |
                Q(coach__username__icontains=search)
            )
        return queryset.annotate(
            enrolled_count=Count('enrollments')
        )

    @staticmethod
    def check_coach_conflict(coach_id, start_time, end_time, exclude_schedule_id=None):
        queryset = Schedule.objects.filter(
            coach_id=coach_id,
            start_time__lt=end_time,
            end_time__gt=start_time
        ).exclude(status=Schedule.Status.CANCELLED)
        if exclude_schedule_id:
            queryset = queryset.exclude(id=exclude_schedule_id)
        return queryset.exists()

    @staticmethod
    def create_schedule(user, **kwargs):
        course = Course.objects.filter(id=kwargs.get('course_id')).first()
        if not course:
            raise ResourceNotFoundException('课程不存在')

        if ScheduleService.check_coach_conflict(
            kwargs['coach_id'],
            kwargs['start_time'],
            kwargs['end_time']
        ):
            raise StatusConflictException('该教练在当前时间段已有排班')

        if 'max_students' not in kwargs:
            kwargs['max_students'] = course.max_students

        schedule = Schedule.objects.create(created_by=user, **kwargs)
        AuditService.log_action(
            user=user,
            action=AuditLog.Action.CREATE,
            instance=schedule,
            new_value=kwargs
        )
        return schedule

    @staticmethod
    def update_schedule_status(user, schedule, new_status, notes=''):
        allowed_transitions = {
            Schedule.Status.DRAFT: [Schedule.Status.PUBLISHED, Schedule.Status.CANCELLED],
            Schedule.Status.PUBLISHED: [Schedule.Status.CONFIRMED, Schedule.Status.CANCELLED],
            Schedule.Status.CONFIRMED: [Schedule.Status.COMPLETED, Schedule.Status.CANCELLED],
            Schedule.Status.COMPLETED: [],
            Schedule.Status.CANCELLED: [],
        }

        if new_status not in allowed_transitions.get(schedule.status, []):
            raise StatusConflictException(
                f'无法从 {schedule.get_status_display()} 变更为 {dict(Schedule.Status.choices)[new_status]}'
            )

        if new_status in [Schedule.Status.COMPLETED] and schedule.actual_students == 0:
            enrolled = schedule.enrollments.filter(
                status__in=[Enrollment.Status.ENROLLED, Enrollment.Status.ATTENDED]
            ).count()
            if enrolled == 0:
                raise ValidationException('当前排班无有效学员，无法完成')

        old_status = schedule.status
        schedule.status = new_status
        if notes:
            schedule.notes = (schedule.notes or '') + f'\n[{timezone.now()}] 状态变更说明: {notes}'
        schedule.save()

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.STATUS_CHANGE,
            instance=schedule,
            old_value={'status': old_status},
            new_value={'status': new_status, 'notes': notes}
        )
        return schedule

    @staticmethod
    def get_schedule_chain(schedule_id):
        schedule = Schedule.objects.filter(id=schedule_id).select_related('course', 'coach').first()
        if not schedule:
            raise ResourceNotFoundException('排班不存在')

        enrollments = schedule.enrollments.select_related('student').all()
        attendances = enrollments.filter(status__in=[Enrollment.Status.ATTENDED, Enrollment.Status.ABSENT])

        return {
            'schedule': schedule,
            'enrollments': enrollments,
            'attendance_stats': {
                'total': enrollments.count(),
                'attended': attendances.filter(status=Enrollment.Status.ATTENDED).count(),
                'absent': attendances.filter(status=Enrollment.Status.ABSENT).count(),
                'leave_approved': enrollments.filter(status=Enrollment.Status.LEAVE_APPROVED).count(),
            }
        }


class EnrollmentService:
    @staticmethod
    def list_enrollments(schedule_id=None, student_id=None, status=None, start_date=None, end_date=None):
        queryset = Enrollment.objects.select_related('schedule', 'student', 'schedule__course').all()
        if schedule_id:
            queryset = queryset.filter(schedule_id=schedule_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if status:
            queryset = queryset.filter(status=status)
        if start_date:
            queryset = queryset.filter(schedule__start_time__gte=start_date)
        if end_date:
            queryset = queryset.filter(schedule__start_time__lte=end_date + timedelta(days=1))
        return queryset

    @staticmethod
    def create_enrollment(user, schedule_id, student_id, notes=''):
        schedule = Schedule.objects.filter(id=schedule_id).first()
        if not schedule:
            raise ResourceNotFoundException('排班不存在')

        if schedule.status not in [Schedule.Status.PUBLISHED, Schedule.Status.CONFIRMED]:
            raise StatusConflictException(f'当前排班状态为{schedule.get_status_display()}，无法报名')

        if timezone.now() > schedule.start_time:
            raise StatusConflictException('课程已开始，无法报名')

        student = Student.objects.filter(id=student_id).first()
        if not student:
            raise ResourceNotFoundException('学员不存在')

        enrolled_count = schedule.enrollments.filter(
            status__in=[Enrollment.Status.ENROLLED, Enrollment.Status.ATTENDED, Enrollment.Status.LEAVE_APPROVED]
        ).count()
        if enrolled_count >= schedule.max_students:
            raise StatusConflictException('该课程已满员')

        if schedule.enrollments.filter(student_id=student_id).exists():
            raise StatusConflictException('该学员已报名此课程')

        enrollment = Enrollment.objects.create(
            schedule=schedule,
            student=student,
            notes=notes
        )

        schedule.actual_students = enrolled_count + 1
        schedule.save(update_fields=['actual_students'])

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.CREATE,
            instance=enrollment,
            new_value={'schedule_id': schedule_id, 'student_id': student_id, 'notes': notes}
        )
        return enrollment

    @staticmethod
    def update_attendance(user, enrollment_id, status, notes=''):
        enrollment = Enrollment.objects.filter(id=enrollment_id).first()
        if not enrollment:
            raise ResourceNotFoundException('报名记录不存在')

        if enrollment.status not in [Enrollment.Status.ENROLLED, Enrollment.Status.LEAVE_APPROVED]:
            raise StatusConflictException(f'当前状态为{enrollment.get_status_display()}，无法修改考勤')

        if timezone.now() < enrollment.schedule.start_time:
            raise StatusConflictException('课程尚未开始，无法签到')

        allowed_statuses = [Enrollment.Status.ATTENDED, Enrollment.Status.ABSENT]
        if status not in allowed_statuses:
            raise ValidationException(f'无效的考勤状态，可选值: {[s for s in allowed_statuses]}')

        old_status = enrollment.status
        enrollment.status = status
        enrollment.attendance_time = timezone.now() if status == Enrollment.Status.ATTENDED else None
        if notes:
            enrollment.notes = (enrollment.notes or '') + f'\n[{timezone.now()}] 考勤备注: {notes}'
        enrollment.save()

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.STATUS_CHANGE,
            instance=enrollment,
            old_value={'status': old_status},
            new_value={'status': status, 'notes': notes}
        )
        return enrollment

    @staticmethod
    def apply_leave(user, enrollment_id, reason):
        enrollment = Enrollment.objects.filter(id=enrollment_id).first()
        if not enrollment:
            raise ResourceNotFoundException('报名记录不存在')

        if enrollment.status != Enrollment.Status.ENROLLED:
            raise StatusConflictException(f'当前状态为{enrollment.get_status_display()}，无法请假')

        if timezone.now() > enrollment.schedule.start_time:
            raise StatusConflictException('课程已开始，无法请假')

        if not reason or len(reason.strip()) < 5:
            raise ValidationException('请假原因不能少于5个字符')

        enrollment.status = Enrollment.Status.LEAVE_APPROVED
        enrollment.leave_reason = reason
        enrollment.leave_approved_by = user
        enrollment.leave_approved_at = timezone.now()
        enrollment.save()

        schedule = enrollment.schedule
        schedule.actual_students = max(0, schedule.actual_students - 1)
        schedule.save(update_fields=['actual_students'])

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.STATUS_CHANGE,
            instance=enrollment,
            old_value={'status': Enrollment.Status.ENROLLED},
            new_value={'status': Enrollment.Status.LEAVE_APPROVED, 'leave_reason': reason}
        )
        return enrollment

    @staticmethod
    def get_student_chain(student_id):
        student = Student.objects.filter(id=student_id).first()
        if not student:
            raise ResourceNotFoundException('学员不存在')

        enrollments = Enrollment.objects.filter(student_id=student_id).select_related(
            'schedule', 'schedule__course', 'schedule__coach'
        ).order_by('-schedule__start_time')

        stats = {
            'total_enrolled': enrollments.count(),
            'attended': enrollments.filter(status=Enrollment.Status.ATTENDED).count(),
            'absent': enrollments.filter(status=Enrollment.Status.ABSENT).count(),
            'leave_approved': enrollments.filter(status=Enrollment.Status.LEAVE_APPROVED).count(),
            'attendance_rate': 0
        }
        completed = enrollments.filter(status__in=[
            Enrollment.Status.ATTENDED,
            Enrollment.Status.ABSENT
        ]).count()
        if completed > 0:
            stats['attendance_rate'] = round(stats['attended'] / completed * 100, 1)

        return {
            'student': student,
            'enrollments': enrollments,
            'stats': stats
        }
