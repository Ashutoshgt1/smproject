from rest_framework import viewsets, permissions, filters
from .models import Review, Complaint
from .serializers import ReviewSerializer, ComplaintSerializer
from service_booking.apps.accounts.models import Notification
from service_booking.apps.bookings.views import notify_user

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['customer__username', 'booking__id']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['booking__id', 'description']
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']

    def perform_update(self, serializer):
        instance = serializer.save()
        customer_user = instance.booking.customer.user if hasattr(instance.booking.customer, 'user') else None
        if customer_user and 'status' in serializer.validated_data:
            status = serializer.validated_data['status']
            notify_user(
                customer_user,
                'complaint_status',
                f'Your complaint for booking #{instance.booking.id} is now {status}.',
                'Complaint',
                instance.id
            )
