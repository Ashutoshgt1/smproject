from django.core.management.base import BaseCommand
from django.utils import timezone
from service_booking.apps.bookings.models import Booking
from service_booking.apps.accounts.models import Notification
from service_booking.apps.bookings.views import notify_user

class Command(BaseCommand):
    help = 'Send reminders for bookings scheduled in the next hour.'

    def handle(self, *args, **options):
        now = timezone.now()
        one_hour_later = now + timezone.timedelta(hours=1)
        bookings = Booking.objects.filter(
            scheduled_time__gte=now,
            scheduled_time__lte=one_hour_later,
            status='confirmed'
        )
        count = 0
        for booking in bookings:
            customer_user = booking.customer.user if hasattr(booking.customer, 'user') else None
            if not customer_user:
                continue
            # Avoid duplicate reminders
            already_notified = Notification.objects.filter(
                recipient=customer_user,
                type='booking_reminder',
                related_type='Booking',
                related_id=booking.id,
                message__icontains='reminder'
            ).exists()
            if not already_notified:
                notify_user(
                    customer_user,
                    'booking_reminder',
                    f'Reminder: Your booking #{booking.id} is scheduled at {booking.scheduled_time.strftime("%Y-%m-%d %H:%M")}.',
                    'Booking',
                    booking.id
                )
                count += 1
        self.stdout.write(self.style.SUCCESS(f'Sent {count} booking reminders.')) 