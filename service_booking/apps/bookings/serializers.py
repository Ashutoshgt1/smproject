from rest_framework import serializers
from .models import Booking
from service_booking.apps.accounts.serializers import ServiceSerializer, ProviderProfileSerializer, CustomerProfileSerializer

class BookingSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    customer = CustomerProfileSerializer(read_only=True)
    provider = ProviderProfileSerializer(read_only=True)
    class Meta:
        model = Booking
        fields = [
            'id', 'service', 'customer', 'provider', 'status', 'scheduled_time', 'location',
            'payment_details', 'rating', 'feedback', 'notified_providers', 'created_at'
        ]
        read_only_fields = ['created_at'] 