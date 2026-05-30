from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RepairTicketViewSet

router = DefaultRouter()
router.register(r'repairs', RepairTicketViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
