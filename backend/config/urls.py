from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import (
    admin_only_test,
    verify_pass,
    check_in,
    dashboard_summary,
    visit_report,
    VisitorViewSet,
    VisitViewSet,
    EmployeeViewSet,
)

router = DefaultRouter()
router.register(r'visitors', VisitorViewSet, basename='visitor')
router.register(r'visits', VisitViewSet, basename='visit')
router.register(r'employees', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/admin-test/', admin_only_test, name='admin_only_test'),
    path('api/passes/verify/', verify_pass, name='verify_pass'),
    path('api/passes/check-in/', check_in, name='check_in'),
    path('api/dashboard/summary/', dashboard_summary, name='dashboard_summary'),
    path('api/reports/visits/', visit_report, name='visit_report'),
    path('api/', include(router.urls)),
]