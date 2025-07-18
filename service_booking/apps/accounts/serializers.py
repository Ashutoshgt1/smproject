from rest_framework import serializers
from .models import User, ProviderProfile, CustomerProfile, Service, Material, AdminProfile, AuditLog, Notification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'is_staff', 'date_joined']

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name']

class ProviderProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    class Meta:
        model = ProviderProfile
        fields = [
            'id', 'user', 'phone', 'email', 'service', 'is_available', 'location', 'assigned_bookings',
            'rating', 'total_jobs_completed', 'salary_details', 'monthly_activity', 'payment_history',
            'refresh_token', 'is_approved', 'last_active', 'availability'
        ]
        read_only_fields = ['user', 'last_active', 'rating']

class CustomerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = CustomerProfile
        fields = [
            'id', 'user', 'phone', 'email', 'address', 'location', 'booking_history',
            'payment_history', 'refresh_token', 'last_active'
        ]
        read_only_fields = ['user', 'last_active']

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'name', 'qrCode', 'price', 'unit']

class AdminProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = AdminProfile
        fields = ['id', 'user', 'phone', 'superAdmin', 'refreshToken', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']

class AuditLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'action', 'target_type', 'target_id', 'details', 'timestamp']
        read_only_fields = ['user', 'timestamp']

class NotificationSerializer(serializers.ModelSerializer):
    recipient = UserSerializer(read_only=True)
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'type', 'message', 'related_type', 'related_id', 'read', 'timestamp']
        read_only_fields = ['recipient', 'timestamp']

MaterialSerializer = MaterialSerializer
AdminProfileSerializer = AdminProfileSerializer
