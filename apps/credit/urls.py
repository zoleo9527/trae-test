from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CreditRecordViewSet, RepaymentRecordViewSet, CreditReminderViewSet

router = DefaultRouter()
router.register(r'credits', CreditRecordViewSet, basename='creditrecord')
router.register(r'repayments', RepaymentRecordViewSet, basename='repaymentrecord')
router.register(r'reminders', CreditReminderViewSet, basename='creditreminder')

urlpatterns = [
    path('', include(router.urls)),
]
