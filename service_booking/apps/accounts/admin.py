from django.contrib import admin
from .models import User, ProviderProfile, CustomerProfile, Service, Material, AdminProfile, AuditLog, Notification

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email')
    list_filter = ('is_active', 'is_staff')
    ordering = ('-date_joined',)

@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'phone', 'service', 'is_available', 'rating', 'is_approved', 'last_active')
    search_fields = ('user__username', 'phone', 'service__name')
    list_filter = ('service', 'is_available', 'is_approved')
    ordering = ('-rating', '-last_active')

@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'phone', 'email', 'address', 'last_active')
    search_fields = ('user__username', 'phone', 'email', 'address')
    ordering = ('-last_active',)

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'qrCode', 'price', 'unit')
    search_fields = ('name', 'qrCode')
    ordering = ('name',)

@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'phone', 'superAdmin', 'created_at', 'updated_at')
    search_fields = ('user__username', 'phone')
    list_filter = ('superAdmin',)
    ordering = ('-created_at',)

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'action', 'target_type', 'target_id', 'timestamp')
    search_fields = ('user__username', 'action', 'target_type', 'target_id')
    list_filter = ('action', 'target_type')
    ordering = ('-timestamp',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'recipient', 'type', 'message', 'read', 'timestamp')
    search_fields = ('recipient__username', 'type', 'message')
    list_filter = ('type', 'read')
    ordering = ('-timestamp',) 