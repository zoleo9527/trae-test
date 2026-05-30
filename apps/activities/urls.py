from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActivityViewSet, ActivityCategoryViewSet, ActivityRegistrationViewSet, VolunteerFeedbackViewSet

router = DefaultRouter()
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'activity-categories', ActivityCategoryViewSet)
router.register(r'activity-registrations', ActivityRegistrationViewSet, basename='activityregistration')
router.register(r'volunteer-feedbacks', VolunteerFeedbackViewSet, basename='volunteerfeedback')

urlpatterns = [
    path('', include(router.urls)),
]
