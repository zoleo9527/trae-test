from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StoreGroupViewSet, StoreViewSet, ProductViewSet, InventoryViewSet,
    ReplenishmentPlanViewSet, ReplenishmentOrderViewSet, TransferOrderViewSet,
    DisplayRecordViewSet, MemberRedemptionViewSet, AuditLogViewSet,
    DashboardViewSet
)

router = DefaultRouter()

router.register(r'store-groups', StoreGroupViewSet, basename='store-group')
router.register(r'stores', StoreViewSet, basename='store')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'inventories', InventoryViewSet, basename='inventory')
router.register(r'replenishment-plans', ReplenishmentPlanViewSet, basename='replenishment-plan')
router.register(r'replenishment-orders', ReplenishmentOrderViewSet, basename='replenishment-order')
router.register(r'transfer-orders', TransferOrderViewSet, basename='transfer-order')
router.register(r'display-records', DisplayRecordViewSet, basename='display-record')
router.register(r'redemptions', MemberRedemptionViewSet, basename='redemption')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
