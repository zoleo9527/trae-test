from django.contrib import admin
from .models import Course, Student, Schedule, Enrollment


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'course_type', 'level', 'duration', 'max_students', 'is_active']
    list_filter = ['course_type', 'level', 'is_active']
    search_fields = ['name']


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['name', 'gender', 'phone', 'swim_level', 'is_active', 'created_at']
    list_filter = ['gender', 'swim_level', 'is_active']
    search_fields = ['name', 'phone']


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ['course', 'coach', 'start_time', 'end_time', 'status', 'max_students', 'actual_students']
    list_filter = ['status', 'start_time']
    search_fields = ['course__name', 'coach__username']
    date_hierarchy = 'start_time'


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'schedule', 'status', 'enrolled_at', 'attendance_time']
    list_filter = ['status', 'enrolled_at']
    search_fields = ['student__name', 'schedule__course__name']
