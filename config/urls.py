from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from apps.common.views import dashboard_stats

router = DefaultRouter()

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/dashboard/', dashboard_stats, name='dashboard_stats'),
    path('api/', include(router.urls)),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.venues.urls')),
    path('api/', include('apps.devices.urls')),
    path('api/', include('apps.inspections.urls')),
    path('api/', include('apps.repairs.urls')),
    path('api/', include('apps.borrowing.urls')),
    path('api/', include('apps.activities.urls')),
    path('api/', include('apps.audit.urls')),
]
