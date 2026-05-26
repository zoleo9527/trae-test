from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, WasteTypeViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'waste-types', WasteTypeViewSet, basename='wastetype')

urlpatterns = [
    path('', include(router.urls)),
]
