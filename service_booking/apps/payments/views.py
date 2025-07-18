from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Payment
from service_booking.apps.bookings.models import Booking
from service_booking.apps.accounts.models import Notification
from service_booking.apps.bookings.views import notify_user
import razorpay
import json
from django.conf import settings

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    # Add your PaymentSerializer import here

    @action(detail=False, methods=['post'])
    def create_order(self, request):
        booking_id = request.data.get('booking_id')
        amount = request.data.get('amount')
        booking = Booking.objects.get(id=booking_id)
        user = request.user
        payment = Payment.objects.create(user=user, booking=booking, amount=amount, status='pending')
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        order = client.order.create({'amount': int(float(amount) * 100), 'currency': 'INR', 'payment_capture': 1})
        payment.invoice_url = order.get('receipt', '')
        payment.save()
        return Response({'order_id': order['id'], 'payment_id': payment.id})

    @method_decorator(csrf_exempt, name='dispatch')
    @action(detail=False, methods=['post'], url_path='webhook')
    def razorpay_webhook(self, request):
        data = json.loads(request.body.decode('utf-8'))
        event = data.get('event')
        payload = data.get('payload', {})
        if event == 'payment.captured':
            payment_entity = payload.get('payment', {}).get('entity', {})
            order_id = payment_entity.get('order_id')
            # Find Payment by order_id (you may need to store order_id in Payment model)
            payment = Payment.objects.filter(invoice_url=order_id).first()
            if payment:
                payment.status = 'paid'
                payment.save()
                notify_user(payment.user, 'payment_received', f'Payment received for booking #{payment.booking.id}. Thank you!', 'Payment', payment.id)
        elif event == 'invoice.paid':
            invoice_entity = payload.get('invoice', {}).get('entity', {})
            invoice_url = invoice_entity.get('short_url')
            payment = Payment.objects.filter(invoice_url=invoice_url).first()
            if payment:
                notify_user(payment.user, 'invoice_available', f'Invoice available for booking #{payment.booking.id}.', 'Payment', payment.id)
        return Response({'status': 'ok'})

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'paid':
            notify_user(instance.user, 'payment_received', f'Payment received for booking #{instance.booking.id}. Thank you!', 'Payment', instance.id)
        if instance.invoice_url:
            notify_user(instance.user, 'invoice_available', f'Invoice available for booking #{instance.booking.id}.', 'Payment', instance.id)
