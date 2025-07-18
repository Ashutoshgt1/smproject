from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ProviderProfileViewSet, CustomerProfileViewSet, ServiceViewSet, MaterialViewSet, AdminProfileViewSet, AuditLogViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'providers', ProviderProfileViewSet, basename='providerprofile')
router.register(r'customers', CustomerProfileViewSet, basename='customerprofile')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'materials', MaterialViewSet, basename='material')
router.register(r'admins', AdminProfileViewSet, basename='adminprofile')
router.register(r'auditlogs', AuditLogViewSet, basename='auditlog')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = router.urls
