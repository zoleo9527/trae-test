from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MembershipPlanViewSet, MembershipCardViewSet,
    RechargeRecordViewSet, ConsumptionRecordViewSet
)

router = DefaultRouter()
router.register(r'plans', MembershipPlanViewSet, basename='membership-plan')
router.register(r'cards', MembershipCardViewSet, basename='membership-card')
router.register(r'recharges', RechargeRecordViewSet, basename='recharge-record')
router.register(r'consumptions', ConsumptionRecordViewSet, basename='consumption-record')

urlpatterns = [
    path('', include(router.urls)),
]
