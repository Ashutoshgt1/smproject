from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Address
from .serializers import AddressSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

# Create your views here.

class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(customer__user=self.request.user)

    def perform_create(self, serializer):
        customer = self.request.user.customer_profile
        if serializer.validated_data.get('is_default', False):
            Address.objects.filter(customer=customer, is_default=True).update(is_default=False)
        serializer.save(customer=customer)
    
    def perform_update(self, serializer):
        customer = self.request.user.customer_profile
        if serializer.validated_data.get('is_default', False):
            Address.objects.filter(customer=customer, is_default=True).update(is_default=False)
        serializer.save()

class RegisterView(APIView):
    permission_classes = []
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'detail': 'Registration successful.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'user_type': getattr(user, 'user_type', None),
    })
