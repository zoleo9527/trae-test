from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Course, Student, Schedule, Enrollment
from .serializers import (
    CourseSerializer, StudentSerializer, ScheduleSerializer, EnrollmentSerializer,
    ScheduleDetailSerializer, LeaveApplySerializer, AttendanceUpdateSerializer,
    ScheduleStatusUpdateSerializer
)
from .services import CourseService, StudentService, ScheduleService, EnrollmentService
from apps.core.permissions import IsDirector, IsCoachSupervisor, IsFrontDesk, IsCoach
from apps.core.services import ExportService, AuditService
from apps.core.models_audit import AuditLog
from apps.core.exceptions import PermissionDeniedException


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsCoachSupervisor()]
        return super().get_permissions()

    def list(self, request):
        course_type = request.query_params.get('course_type')
        level = request.query_params.get('level')
        is_active = request.query_params.get('is_active')
        search = request.query_params.get('search')

        queryset = CourseService.list_courses(
            course_type=course_type, level=level, is_active=is_active, search=search
        )
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def perform_create(self, serializer):
        course = CourseService.create_course(self.request.user, **serializer.validated_data)
        serializer.instance = course


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsFrontDesk()]
        return super().get_permissions()

    def list(self, request):
        gender = request.query_params.get('gender')
        is_active = request.query_params.get('is_active')
        swim_level = request.query_params.get('swim_level')
        search = request.query_params.get('search')

        queryset = StudentService.list_students(
            gender=gender, is_active=is_active, swim_level=swim_level, search=search
        )
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=['get'])
    def chain(self, request, pk=None):
        data = EnrollmentService.get_student_chain(pk)
        return Response({
            'code': 200,
            'message': 'success',
            'data': {
                'student': StudentSerializer(data['student']).data,
                'enrollments': EnrollmentSerializer(data['enrollments'], many=True).data,
                'stats': data['stats']
            }
        })

    def perform_create(self, serializer):
        student = StudentService.create_student(self.request.user, **serializer.validated_data)
        serializer.instance = student


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsCoachSupervisor()]
        if self.action in ['update_status', 'attendance_report']:
            return [IsCoachSupervisor()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action == 'chain':
            return ScheduleDetailSerializer
        return super().get_serializer_class()

    def list(self, request):
        course_id = request.query_params.get('course_id')
        coach_id = request.query_params.get('coach_id')
        status_val = request.query_params.get('status')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        search = request.query_params.get('search')

        queryset = ScheduleService.list_schedules(
            course_id=course_id, coach_id=coach_id, status=status_val,
            start_date=start_date, end_date=end_date, search=search
        )

        if request.query_params.get('export') == '1':
            fields = [
                {'label': '课程名称', 'value': lambda o: o.course.name, 'width': 20},
                {'label': '教练', 'value': lambda o: o.coach.username, 'width': 12},
                {'label': '开始时间', 'value': 'start_time', 'width': 20},
                {'label': '结束时间', 'value': 'end_time', 'width': 20},
                {'label': '状态', 'value': lambda o: o.get_status_display(), 'width': 10},
                {'label': '报名人数', 'value': 'enrolled_count', 'width': 10},
                {'label': '泳道', 'value': 'pool_lane', 'width': 10},
            ]
            return ExportService.export_to_excel(queryset, fields, 'schedules')

        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def perform_create(self, serializer):
        schedule = ScheduleService.create_schedule(self.request.user, **serializer.validated_data)
        serializer.instance = schedule

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        schedule = self.get_object()
        serializer = ScheduleStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        schedule = ScheduleService.update_schedule_status(
            request.user, schedule,
            serializer.validated_data['status'],
            serializer.validated_data.get('notes', '')
        )
        return Response({
            'code': 200,
            'message': '状态更新成功',
            'data': ScheduleSerializer(schedule).data
        })

    @action(detail=True, methods=['get'])
    def chain(self, request, pk=None):
        data = ScheduleService.get_schedule_chain(pk)
        return Response({
            'code': 200,
            'message': 'success',
            'data': {
                'schedule': ScheduleSerializer(data['schedule']).data,
                'enrollments': EnrollmentSerializer(data['enrollments'], many=True).data,
                'attendance_stats': data['attendance_stats']
            }
        })

    @action(detail=False, methods=['get'])
    def attendance_report(self, request):
        if not request.user.role in ['director', 'coach_supervisor']:
            raise PermissionDeniedException('只有馆长和教练主管可以查看考勤报表')

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        coach_id = request.query_params.get('coach_id')

        schedules = ScheduleService.list_schedules(
            coach_id=coach_id, start_date=start_date, end_date=end_date,
            status=Schedule.Status.COMPLETED
        )

        report_data = []
        for sched in schedules:
            enrollments = sched.enrollments.all()
            report_data.append({
                'schedule_id': sched.id,
                'course_name': sched.course.name,
                'coach': sched.coach.username,
                'date': sched.start_time.strftime('%Y-%m-%d'),
                'time': f'{sched.start_time.strftime("%H:%M")}-{sched.end_time.strftime("%H:%M")}',
                'total': enrollments.count(),
                'attended': enrollments.filter(status='attended').count(),
                'absent': enrollments.filter(status='absent').count(),
                'leave_approved': enrollments.filter(status='leave_approved').count(),
                'attendance_rate': round(
                    enrollments.filter(status='attended').count() / enrollments.count() * 100, 1
                ) if enrollments.count() > 0 else 0
            })

        return Response({
            'code': 200,
            'message': 'success',
            'data': report_data
        })


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    http_method_names = ['get', 'post', 'head', 'options']

    def get_permissions(self):
        if self.action in ['create', 'apply_leave']:
            return [IsFrontDesk()]
        if self.action in ['update_attendance', 'batch_attendance']:
            return [IsCoach()]
        return super().get_permissions()

    def list(self, request):
        schedule_id = request.query_params.get('schedule_id')
        student_id = request.query_params.get('student_id')
        status_val = request.query_params.get('status')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        queryset = EnrollmentService.list_enrollments(
            schedule_id=schedule_id, student_id=student_id, status=status_val,
            start_date=start_date, end_date=end_date
        )
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def create(self, request):
        schedule_id = request.data.get('schedule_id')
        student_id = request.data.get('student_id')
        notes = request.data.get('notes', '')

        enrollment = EnrollmentService.create_enrollment(
            request.user, schedule_id, student_id, notes
        )
        return Response({
            'code': 200,
            'message': '报名成功',
            'data': EnrollmentSerializer(enrollment).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def apply_leave(self, request, pk=None):
        enrollment = self.get_object()
        serializer = LeaveApplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        enrollment = EnrollmentService.apply_leave(
            request.user, pk, serializer.validated_data['reason']
        )
        return Response({
            'code': 200,
            'message': '请假已批准',
            'data': EnrollmentSerializer(enrollment).data
        })

    @action(detail=True, methods=['post'])
    def update_attendance(self, request, pk=None):
        serializer = AttendanceUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        enrollment = EnrollmentService.update_attendance(
            request.user, pk,
            serializer.validated_data['status'],
            serializer.validated_data.get('notes', '')
        )
        return Response({
            'code': 200,
            'message': '考勤更新成功',
            'data': EnrollmentSerializer(enrollment).data
        })

    @action(detail=False, methods=['post'])
    def batch_attendance(self, request):
        schedule_id = request.data.get('schedule_id')
        attendances = request.data.get('attendances', [])

        if not schedule_id or not attendances:
            return Response({
                'code': 400,
                'message': '缺少schedule_id或attendances参数',
                'data': None
            }, status=400)

        results = []
        for item in attendances:
            try:
                enrollment = EnrollmentService.update_attendance(
                    request.user,
                    item['enrollment_id'],
                    item['status'],
                    item.get('notes', '')
                )
                results.append({
                    'enrollment_id': item['enrollment_id'],
                    'success': True,
                    'data': EnrollmentSerializer(enrollment).data
                })
            except Exception as e:
                results.append({
                    'enrollment_id': item['enrollment_id'],
                    'success': False,
                    'error': str(e)
                })

        return Response({
            'code': 200,
            'message': '批量考勤处理完成',
            'data': results
        })
