from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InspectionPlanViewSet, CheckItemViewSet, InspectionRecordViewSet

router = DefaultRouter()
router.register(r'inspection-plans', InspectionPlanViewSet)
router.register(r'check-items', CheckItemViewSet)
router.register(r'inspections', InspectionRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
