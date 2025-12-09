from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for viewsets
router = DefaultRouter()
router.register(r'voters', views.VoterViewSet, basename='voter')
router.register(r'volunteers', views.VolunteerViewSet, basename='volunteer')

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health-check'),
    
    # Authentication endpoints
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/user/', views.current_user_view, name='current-user'),
    path('auth/csrf/', views.csrf_token_view, name='csrf-token'),
    
    # App settings
    path('settings/', views.app_settings_view, name='app-settings'),
    
    # Dashboard endpoints
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    
    # Include router URLs
    path('', include(router.urls)),
]
