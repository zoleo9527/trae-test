from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VenueViewSet, VenueAreaViewSet

router = DefaultRouter()
router.register(r'venues', VenueViewSet)
router.register(r'venue-areas', VenueAreaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
