from django.db import models
from django.conf import settings
from service_booking.apps.accounts.models import Service, ProviderProfile, CustomerProfile

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='bookings')
    customer = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name='bookings')
    provider = models.ForeignKey(ProviderProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    scheduled_time = models.DateTimeField(null=True, blank=True)
    location = models.JSONField(default=dict, blank=True)  # {'city': str, 'coordinates': {'lat': float, 'lng': float}}
    payment_details = models.JSONField(default=dict, blank=True)  # {'amount': 0, ...}
    rating = models.FloatField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    notified_providers = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking #{self.id} for {self.service.name} by {self.customer.user.username}"

    class Meta:
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'
