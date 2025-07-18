from rest_framework import serializers
from .models import Review, Complaint

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'booking', 'customer', 'rating', 'comment', 'created_at']

class ComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ['id', 'booking', 'description', 'status', 'admin_note', 'created_at']
        read_only_fields = ['created_at'] 