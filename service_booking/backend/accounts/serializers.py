from django.contrib.auth.models import User
from .models import Address, CustomerProfile
from rest_framework import serializers

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'label', 'address', 'city', 'state', 'zip_code', 'is_default', 'created_at']

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'phone')

    def create(self, validated_data):
        phone = validated_data.pop('phone', '')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        CustomerProfile.objects.create(user=user, phone=phone)
        return user 