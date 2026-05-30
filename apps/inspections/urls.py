from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InspectionPlanViewSet, CheckItemViewSet, InspectionRecordViewSet

router = DefaultRouter()
router.register(r'inspection-plans', InspectionPlanViewSet, basename='inspectionplan')
router.register(r'check-items', CheckItemViewSet, basename='checkitem')
router.register(r'inspections', InspectionRecordViewSet, basename='inspection')

urlpatterns = [
    path('', include(router.urls)),
]
