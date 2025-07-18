from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    phone = models.CharField(max_length=20, blank=True)
    # Add other fields as needed

    def __str__(self):
        return self.user.username

class Address(models.Model):
    customer = models.ForeignKey(CustomerProfile, related_name='addresses', on_delete=models.CASCADE)
    label = models.CharField(max_length=100, blank=True)  # e.g., 'Home', 'Work'
    address = models.TextField()
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.label or self.address[:20]} ({self.customer.user.username})'
