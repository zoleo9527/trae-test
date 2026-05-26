from rest_framework import serializers
from .models import Course, Student, Schedule, Enrollment
from apps.core.serializers import UserSerializer


class CourseSerializer(serializers.ModelSerializer):
    course_type_display = serializers.CharField(source='get_course_type_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    schedule_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    swim_level_display = serializers.CharField(source='get_swim_level_display', read_only=True)
    enrollment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Student
        fields = '__all__'


class SimpleCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name', 'course_type', 'level']


class SimpleStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'name', 'phone', 'gender']


class ScheduleSerializer(serializers.ModelSerializer):
    course_info = SimpleCourseSerializer(source='course', read_only=True)
    coach_info = UserSerializer(source='coach', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    enrolled_count = serializers.IntegerField(read_only=True)
    created_by_info = UserSerializer(source='created_by', read_only=True)

    class Meta:
        model = Schedule
        fields = '__all__'
        read_only_fields = ['created_by', 'actual_students']


class EnrollmentSerializer(serializers.ModelSerializer):
    schedule_info = ScheduleSerializer(source='schedule', read_only=True)
    student_info = SimpleStudentSerializer(source='student', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    leave_approved_by_info = UserSerializer(source='leave_approved_by', read_only=True)

    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ['enrolled_at', 'attendance_time', 'leave_approved_at']


class ScheduleDetailSerializer(ScheduleSerializer):
    enrollments = EnrollmentSerializer(many=True, read_only=True)
    attendance_stats = serializers.SerializerMethodField()

    def get_attendance_stats(self, obj):
        return {
            'total': obj.enrollments.count(),
            'attended': obj.enrollments.filter(status='attended').count(),
            'absent': obj.enrollments.filter(status='absent').count(),
            'leave_approved': obj.enrollments.filter(status='leave_approved').count(),
        }

    class Meta(ScheduleSerializer.Meta):
        fields = '__all__'


class LeaveApplySerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=5, max_length=500)


class AttendanceUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[('attended', '已上课'), ('absent', '缺勤')])
    notes = serializers.CharField(required=False, max_length=200)


class ScheduleStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Schedule.Status.choices)
    notes = serializers.CharField(required=False, max_length=500)
