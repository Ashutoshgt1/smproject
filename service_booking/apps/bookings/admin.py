from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'service', 'customer', 'provider', 'status', 'scheduled_time', 'created_at')
    search_fields = ('service__name', 'customer__user__username', 'provider__user__username')
    list_filter = ('status', 'service')
    ordering = ('-created_at',) 