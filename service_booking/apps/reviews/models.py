from django.db import models
from service_booking.apps.bookings.models import Booking

class Complaint(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    ]
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='complaints')
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Complaint #{self.id} for Booking {self.booking.id}"
