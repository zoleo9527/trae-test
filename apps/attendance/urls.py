from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReconciliationBatchViewSet, AttendanceSummaryViewSet

router = DefaultRouter()
router.register(r'batches', ReconciliationBatchViewSet, basename='reconciliation-batch')
router.register(r'summaries', AttendanceSummaryViewSet, basename='attendance-summary')

urlpatterns = [
    path('', include(router.urls)),
]
