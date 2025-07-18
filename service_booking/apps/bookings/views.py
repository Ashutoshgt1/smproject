from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Booking
from .serializers import BookingSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from .models import Booking
from .serializers import BookingSerializer
from .services import get_top_providers
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAdminUser
from service_booking.apps.accounts.models import Notification, CustomerProfile

User = get_user_model()

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

def notify_user(user, notif_type, message, related_type='', related_id=None):
    Notification.objects.create(
        recipient=user,
        type=notif_type,
        message=message,
        related_type=related_type,
        related_id=related_id,
    )

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'service', 'provider', 'customer']
    search_fields = ['service__name', 'customer__user__username', 'provider__user__username', 'id']
    ordering_fields = ['created_at', 'scheduled_time', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        # Date range filtering
        created_from = self.request.query_params.get('created_from')
        created_to = self.request.query_params.get('created_to')
        scheduled_from = self.request.query_params.get('scheduled_from')
        scheduled_to = self.request.query_params.get('scheduled_to')
        if created_from:
            queryset = queryset.filter(created_at__gte=created_from)
        if created_to:
            queryset = queryset.filter(created_at__lte=created_to)
        if scheduled_from:
            queryset = queryset.filter(scheduled_time__gte=scheduled_from)
        if scheduled_to:
            queryset = queryset.filter(scheduled_time__lte=scheduled_to)
        return queryset

    def perform_update(self, serializer):
        instance = serializer.save()
        customer_user = instance.customer.user if hasattr(instance.customer, 'user') else None
        if customer_user:
            if 'status' in serializer.validated_data:
                status = serializer.validated_data['status']
                if status == 'confirmed':
                    notify_user(customer_user, 'booking_confirmed', f'Your booking #{instance.id} is confirmed.', 'Booking', instance.id)
                elif status == 'cancelled':
                    notify_user(customer_user, 'booking_cancelled', f'Your booking #{instance.id} was cancelled.', 'Booking', instance.id)
                elif status == 'completed':
                    notify_user(customer_user, 'booking_completed', f'Your booking #{instance.id} is completed.', 'Booking', instance.id)
                    # Prompt for review if not already notified
                    already_prompted = Notification.objects.filter(
                        recipient=customer_user,
                        type='review_prompt',
                        related_type='Booking',
                        related_id=instance.id
                    ).exists()
                    if not already_prompted:
                        notify_user(customer_user, 'review_prompt', f'Please leave a review for your completed booking #{instance.id}.', 'Booking', instance.id)
                elif status == 'rescheduled':
                    notify_user(customer_user, 'booking_rescheduled', f'Your booking #{instance.id} was rescheduled.', 'Booking', instance.id)
            if 'provider' in serializer.validated_data:
                notify_user(customer_user, 'provider_assigned', f'A provider was assigned to your booking #{instance.id}.', 'Booking', instance.id)

    @action(detail=False, methods=['patch'], url_path='bulk_update')
    def bulk_update(self, request):
        ids = request.data.get('ids', [])
        update_data = request.data.get('update', {})
        if not ids or not update_data:
            return Response({'detail': 'ids and update fields required.'}, status=status.HTTP_400_BAD_REQUEST)
        bookings = Booking.objects.filter(id__in=ids)
        bookings.update(**update_data)
        return Response({'detail': f'Updated {bookings.count()} bookings.'})

class BookingRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        category = request.data.get('category')
        user_location = request.data.get('location')
        service = request.data.get('service')
        time = request.data.get('time')
        required_skills = request.data.get('skills', [])
        top_providers = get_top_providers(category, user_location, required_skills, time)
        booking = Booking.objects.create(
            customer=request.user,
            service=service,
            status='pending',
            notified_providers=[p['provider'].user.id for p in top_providers],
            scheduled_time=time
        )
        # Notify providers via Channels
        channel_layer = get_channel_layer()
        for p in top_providers:
            async_to_sync(channel_layer.group_send)(
                f'provider_{p["provider"].user.id}',
                {
                    'type': 'booking.request',
                    'booking_id': booking.id,
                    'service': service,
                    'customer': request.user.username,
                    'scheduled_time': time
                }
            )
        return Response({'booking_id': booking.id, 'providers': [p['provider'].user.username for p in top_providers]}, status=201)

class AdminBookingMonitorView(ListAPIView):
    queryset = Booking.objects.filter(status='pending')
    serializer_class = BookingSerializer
    permission_classes = [IsAdminUser]

class BookingAnalyticsView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        total = Booking.objects.count()
        completed = Booking.objects.filter(status='completed').count()
        avg_response_time = 0  # Placeholder, implement as needed
        return Response({
            'total_bookings': total,
            'completed_bookings': completed,
            'avg_response_time': avg_response_time
        })
