from rest_framework import viewsets, permissions, filters
from .models import User, ProviderProfile, CustomerProfile, Service, Material, AdminProfile, AuditLog, Notification
from .serializers import UserSerializer, ProviderProfileSerializer, CustomerProfileSerializer, ServiceSerializer, MaterialSerializer, AdminProfileSerializer, AuditLogSerializer, NotificationSerializer

def log_admin_action(user, action, target_type, target_id=None, details=None):
    AuditLog.objects.create(
        user=user,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details or {},
    )

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email']
    ordering_fields = ['date_joined', 'username']
    ordering = ['-date_joined']

class ProviderProfileViewSet(viewsets.ModelViewSet):
    queryset = ProviderProfile.objects.all()
    serializer_class = ProviderProfileSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'phone', 'service__name']
    ordering_fields = ['rating', 'last_active']
    ordering = ['-rating', '-last_active']

class CustomerProfileViewSet(viewsets.ModelViewSet):
    queryset = CustomerProfile.objects.all()
    serializer_class = CustomerProfileSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'phone', 'email', 'address']
    ordering_fields = ['last_active']
    ordering = ['-last_active']

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name']
    ordering = ['name']

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'qrCode']
    ordering_fields = ['name', 'price']
    ordering = ['name']

    def perform_create(self, serializer):
        instance = serializer.save()
        log_admin_action(
            self.request.user,
            action="create",
            target_type="Material",
            target_id=instance.id,
            details=serializer.data
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_admin_action(
            self.request.user,
            action="update",
            target_type="Material",
            target_id=instance.id,
            details=serializer.data
        )

    def perform_destroy(self, instance):
        log_admin_action(
            self.request.user,
            action="delete",
            target_type="Material",
            target_id=instance.id,
            details={"name": instance.name, "qrCode": instance.qrCode}
        )
        instance.delete()

class AdminProfileViewSet(viewsets.ModelViewSet):
    queryset = AdminProfile.objects.all()
    serializer_class = AdminProfileSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'phone']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        instance = serializer.save()
        log_admin_action(
            self.request.user,
            action="create",
            target_type="AdminProfile",
            target_id=instance.id,
            details=serializer.data
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_admin_action(
            self.request.user,
            action="update",
            target_type="AdminProfile",
            target_id=instance.id,
            details=serializer.data
        )

    def perform_destroy(self, instance):
        log_admin_action(
            self.request.user,
            action="delete",
            target_type="AdminProfile",
            target_id=instance.id,
            details={"phone": instance.phone, "superAdmin": instance.superAdmin}
        )
        instance.delete()

    def partial_update(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        if 'superAdmin' in request.data:
            log_admin_action(
                request.user,
                action="promote" if request.data['superAdmin'] else "demote",
                target_type="AdminProfile",
                target_id=kwargs['pk'],
                details=request.data
            )
        return response

class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'action', 'target_type', 'target_id']
    ordering_fields = ['timestamp', 'action', 'target_type']
    ordering = ['-timestamp']

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['recipient__username', 'type', 'message', 'related_type', 'related_id']
    ordering_fields = ['timestamp', 'type', 'read']
    ordering = ['-timestamp']
