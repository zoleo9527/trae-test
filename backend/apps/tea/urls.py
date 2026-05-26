from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.tea.views import (
    ActivitySubmissionViewSet, AuditLogViewSet, BatchViewSet,
    DashboardViewSet, InventoryRecordViewSet, OrderViewSet,
    PriceApprovalViewSet, ProductViewSet, ShipmentViewSet, StoreViewSet,
    TrialFollowUpViewSet, WarehouseViewSet,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'warehouses', WarehouseViewSet)
router.register(r'stores', StoreViewSet)
router.register(r'batches', BatchViewSet)
router.register(r'inventory-records', InventoryRecordViewSet)
router.register(r'price-approvals', PriceApprovalViewSet)
router.register(r'activity-submissions', ActivitySubmissionViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'shipments', ShipmentViewSet)
router.register(r'trial-followups', TrialFollowUpViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
