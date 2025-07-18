import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Booking
from django.contrib.auth import get_user_model
User = get_user_model()

class BookingConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope['user']
        if user.is_authenticated:
            await self.channel_layer.group_add(f'provider_{user.id}', self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        user = self.scope['user']
        if user.is_authenticated:
            await self.channel_layer.group_discard(f'provider_{user.id}', self.channel_name)

    async def receive_json(self, content):
        event = content.get('type')
        if event == 'booking_accept':
            booking_id = content.get('booking_id')
            await self.handle_booking_accept(booking_id)

    @database_sync_to_async
    def get_booking(self, booking_id):
        return Booking.objects.get(id=booking_id)

    @database_sync_to_async
    def set_booking_confirmed(self, booking, provider):
        if booking.status == 'pending':
            booking.status = 'confirmed'
            booking.assigned_provider = provider
            booking.save()
            return True
        return False

    async def handle_booking_accept(self, booking_id):
        booking = await self.get_booking(booking_id)
        user = self.scope['user']
        confirmed = await self.set_booking_confirmed(booking, user)
        if confirmed:
            # Notify winner
            await self.channel_layer.group_send(
                f'provider_{user.id}',
                {
                    'type': 'booking.confirmed',
                    'booking_id': booking_id
                }
            )
            # Notify others
            for pid in booking.notified_providers:
                if pid != user.id:
                    await self.channel_layer.group_send(
                        f'provider_{pid}',
                        {
                            'type': 'booking.closed',
                            'booking_id': booking_id
                        }
                    )

    async def booking_request(self, event):
        await self.send_json({
            'type': 'booking_request',
            'booking_id': event['booking_id'],
            'service': event['service'],
            'customer': event['customer'],
            'scheduled_time': event['scheduled_time']
        })

    async def booking_confirmed(self, event):
        await self.send_json({
            'type': 'booking_confirmed',
            'booking_id': event['booking_id']
        })

    async def booking_closed(self, event):
        await self.send_json({
            'type': 'booking_closed',
            'booking_id': event['booking_id']
        })
