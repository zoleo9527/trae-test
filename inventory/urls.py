from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardViewSet, CustomerViewSet, PartViewSet, OrderViewSet,
    PaymentViewSet, CollectionReminderViewSet, CurrentUserView, LoginView
)

router = DefaultRouter()
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'customers', CustomerViewSet)
router.register(r'parts', PartViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'reminders', CollectionReminderViewSet)
router.register(r'user', CurrentUserView, basename='user')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('', include(router.urls)),
]
