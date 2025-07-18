from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()

class Service(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    basePrice = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    baseSalary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    def __str__(self):
        return self.name

class ProviderProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile')
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True, null=True)
    password = models.CharField(max_length=128)  # Store hashed password
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='providers')
    is_available = models.BooleanField(default=True)
    location = models.JSONField(default=dict, blank=True)  # {'city': str, 'coordinates': {'lat': float, 'lng': float}}
    assigned_bookings = models.ManyToManyField('bookings.Booking', blank=True, related_name='assigned_providers')
    rating = models.FloatField(default=0.0)
    total_jobs_completed = models.PositiveIntegerField(default=0)
    # Salary details as JSON
    salary_details = models.JSONField(default=dict, blank=True)  # {'baseSalary': 0, ...}
    monthly_activity = models.JSONField(default=list, blank=True)  # [{'month': str, ...}]
    payment_history = models.JSONField(default=list, blank=True)  # [{'amount': 0, ...}]
    refresh_token = models.CharField(max_length=255, blank=True, null=True)
    is_approved = models.BooleanField(default=False)
    last_active = models.DateTimeField(auto_now=True)
    availability = models.JSONField(default=dict, blank=True)  # {'Monday': [{'from': '10:00', 'to': '18:00'}]}

    def __str__(self):
        return f"{self.user.username} ({self.service.name})"

    class Meta:
        verbose_name = 'Provider Profile'
        verbose_name_plural = 'Provider Profiles'

class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True)
    location = models.JSONField(default=dict, blank=True)  # {'city': str, 'coordinates': {'lat': float, 'lng': float}}
    booking_history = models.ManyToManyField('bookings.Booking', blank=True, related_name='customer_histories')
    payment_history = models.JSONField(default=list, blank=True)  # [{'amount': 0, ...}]
    refresh_token = models.CharField(max_length=255, blank=True, null=True)
    last_active = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.phone})"

    class Meta:
        verbose_name = 'Customer Profile'
        verbose_name_plural = 'Customer Profiles'

class Material(models.Model):
    name = models.CharField(max_length=100)
    qrCode = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    unit = models.CharField(max_length=50, blank=True)  # e.g., 'per meter', 'per kg'

    def __str__(self):
        return f"{self.name} ({self.qrCode})"

class AdminProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    phone = models.CharField(max_length=20, unique=True)
    superAdmin = models.BooleanField(default=False)
    refreshToken = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} (Admin)"

    class Meta:
        verbose_name = 'Admin Profile'
        verbose_name_plural = 'Admin Profiles'

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=100)  # e.g., 'Material', 'AdminProfile'
    target_id = models.IntegerField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} {self.action} {self.target_type} {self.target_id} at {self.timestamp}"

    class Meta:
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-timestamp']

class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=100)
    message = models.TextField()
    related_type = models.CharField(max_length=100, blank=True)
    related_id = models.IntegerField(null=True, blank=True)
    read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.recipient} {self.type} {self.message[:30]}... at {self.timestamp}"

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-timestamp']

@receiver(post_save, sender=Notification)
def broadcast_notification(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        if hasattr(instance.recipient, 'provider_profile'):
            group = f'provider_{instance.recipient.id}'
        elif hasattr(instance.recipient, 'customer_profile'):
            group = f'user_{instance.recipient.id}'
        elif instance.recipient.is_staff:
            group = f'admin_{instance.recipient.id}'
        else:
            group = None
        if group:
            async_to_sync(channel_layer.group_send)(
                group,
                {
                    'type': 'notify',
                    'notification': {
                        'id': instance.id,
                        'type': instance.type,
                        'message': instance.message,
                        'related_type': instance.related_type,
                        'related_id': instance.related_id,
                        'read': instance.read,
                        'timestamp': instance.timestamp.isoformat(),
                    }
                }
            )
