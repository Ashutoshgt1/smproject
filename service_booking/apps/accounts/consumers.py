import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope['user']
        if user.is_authenticated:
            if hasattr(user, 'provider_profile'):
                await self.channel_layer.group_add(f'provider_{user.id}', self.channel_name)
            elif hasattr(user, 'customer_profile'):
                await self.channel_layer.group_add(f'user_{user.id}', self.channel_name)
            if user.is_staff:
                await self.channel_layer.group_add(f'admin_{user.id}', self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        user = self.scope['user']
        if user.is_authenticated:
            if hasattr(user, 'provider_profile'):
                await self.channel_layer.group_discard(f'provider_{user.id}', self.channel_name)
            elif hasattr(user, 'customer_profile'):
                await self.channel_layer.group_discard(f'user_{user.id}', self.channel_name)
            if user.is_staff:
                await self.channel_layer.group_discard(f'admin_{user.id}', self.channel_name)

    async def receive_json(self, content):
        # Optionally handle mark as read, etc.
        pass

    async def notify(self, event):
        await self.send_json({
            'type': 'notification',
            'notification': event['notification']
        }) 