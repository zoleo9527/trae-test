from rest_framework import serializers
from .models import Complaint, ComplaintComment
from apps.core.serializers import UserSerializer
from apps.schedule.serializers import SimpleStudentSerializer


class ComplaintCommentSerializer(serializers.ModelSerializer):
    author_info = UserSerializer(source='author', read_only=True)

    class Meta:
        model = ComplaintComment
        fields = '__all__'
        read_only_fields = ['author']


class ComplaintSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assigned_to_info = UserSerializer(source='assigned_to', read_only=True)
    submitted_by_info = UserSerializer(source='submitted_by', read_only=True)
    student_info = SimpleStudentSerializer(source='student', read_only=True)
    comments = ComplaintCommentSerializer(many=True, read_only=True)
    is_overdue = serializers.SerializerMethodField()

    def get_is_overdue(self, obj):
        from django.utils import timezone
        return obj.expected_resolve_time and obj.expected_resolve_time < timezone.now() and \
               obj.status in [Complaint.Status.SUBMITTED, Complaint.Status.ASSIGNED, Complaint.Status.PROCESSING]

    class Meta:
        model = Complaint
        fields = '__all__'
        read_only_fields = ['submitted_by', 'actual_resolve_time']


class ComplaintCreateSerializer(serializers.Serializer):
    title = serializers.CharField(required=True, max_length=200)
    category = serializers.ChoiceField(choices=Complaint.Category.choices)
    priority = serializers.ChoiceField(choices=Complaint.Priority.choices, default='medium')
    description = serializers.CharField(required=True)
    reporter_name = serializers.CharField(required=False, max_length=50)
    reporter_phone = serializers.CharField(required=False, max_length=20)
    student_id = serializers.IntegerField(required=False)
    location = serializers.CharField(required=False, max_length=100)
    expected_resolve_time = serializers.DateTimeField(required=False)
    notes = serializers.CharField(required=False, max_length=500)


class StatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Complaint.Status.choices)
    notes = serializers.CharField(required=False, max_length=500)


class AssignSerializer(serializers.Serializer):
    assigned_to_id = serializers.IntegerField(required=True)
    notes = serializers.CharField(required=False, max_length=500)


class CommentSerializer(serializers.Serializer):
    content = serializers.CharField(required=True, max_length=1000)
    is_internal = serializers.BooleanField(default=False)


class EscalateSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, max_length=500)
