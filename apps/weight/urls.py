from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WeightTicketViewSet, PriceAdjustmentViewSet

router = DefaultRouter()
router.register(r'tickets', WeightTicketViewSet, basename='weightticket')
router.register(r'price-adjustments', PriceAdjustmentViewSet, basename='priceadjustment')

urlpatterns = [
    path('', include(router.urls)),
]
