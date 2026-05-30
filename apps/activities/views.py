from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Activity, ActivityRegistration, ActivityCategory, VolunteerFeedback, ActivityStatus, RegistrationStatus
from .serializers import (
    ActivitySerializer, ActivityListSerializer, ActivityCategorySerializer,
    ActivityRegistrationSerializer, VolunteerFeedbackSerializer
)
from apps.common.permissions import IsManager, IsVolunteer


class ActivityCategoryViewSet(viewsets.ModelViewSet):
    queryset = ActivityCategory.objects.all()
    serializer_class = ActivityCategorySerializer
    permission_classes = [IsManager]


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.select_related('venue', 'organizer').all()
    serializer_class = ActivitySerializer
    permission_classes = [IsManager]

    def get_serializer_class(self):
        if self.action == 'list':
            return ActivityListSerializer
        return ActivitySerializer

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def checkin(self, request, pk=None):
        activity = self.get_object()
        user_id = request.data.get('user_id')
        checkin_code = request.data.get('checkin_code')

        try:
            registration = ActivityRegistration.objects.get(activity=activity, user_id=user_id)
        except ActivityRegistration.DoesNotExist:
            return Response({'error': '未找到报名记录'}, status=status.HTTP_404_NOT_FOUND)

        if activity.is_need_checkin and activity.checkin_code and checkin_code != activity.checkin_code:
            return Response({'error': '签到码错误'}, status=status.HTTP_400_BAD_REQUEST)

        registration.status = RegistrationStatus.CHECKED_IN
        registration.checkin_time = timezone.now()
        registration.checkin_method = 'code'
        registration.save()

        serializer = ActivityRegistrationSerializer(registration)
        return Response(serializer.data)


class ActivityRegistrationViewSet(viewsets.ModelViewSet):
    queryset = ActivityRegistration.objects.select_related('activity', 'user').all()
    serializer_class = ActivityRegistrationSerializer
    permission_classes = [IsVolunteer]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        registration = self.get_object()
        if registration.status != RegistrationStatus.PENDING:
            return Response({'error': '只有待审核状态可以审批'}, status=status.HTTP_400_BAD_REQUEST)

        registration.status = RegistrationStatus.APPROVED
        registration.reviewer = request.user
        registration.review_time = timezone.now()
        registration.save()

        activity = registration.activity
        activity.current_participants += 1
        activity.save()

        serializer = self.get_serializer(registration)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        registration = self.get_object()
        if registration.status != RegistrationStatus.PENDING:
            return Response({'error': '只有待审核状态可以拒绝'}, status=status.HTTP_400_BAD_REQUEST)

        registration.status = RegistrationStatus.REJECTED
        registration.reviewer = request.user
        registration.review_time = timezone.now()
        registration.review_comments = request.data.get('comments', '')
        registration.save()

        serializer = self.get_serializer(registration)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def submit_feedback(self, request, pk=None):
        registration = self.get_object()
        if registration.status != RegistrationStatus.CHECKED_IN:
            return Response({'error': '只有已签到用户可以提交反馈'}, status=status.HTTP_400_BAD_REQUEST)

        registration.feedback_rating = request.data.get('rating')
        registration.feedback_comments = request.data.get('comments', '')
        registration.feedback_time = timezone.now()
        registration.save()

        serializer = self.get_serializer(registration)
        return Response(serializer.data)


class VolunteerFeedbackViewSet(viewsets.ModelViewSet):
    queryset = VolunteerFeedback.objects.select_related('activity', 'volunteer', 'handler').all()
    serializer_class = VolunteerFeedbackSerializer
    permission_classes = [IsVolunteer]

    def perform_create(self, serializer):
        serializer.save(volunteer=self.request.user)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        feedback = self.get_object()
        feedback.is_resolved = True
        feedback.handler = request.user
        feedback.handle_notes = request.data.get('notes', '')
        feedback.handle_time = timezone.now()
        feedback.save()

        serializer = self.get_serializer(feedback)
        return Response(serializer.data)
