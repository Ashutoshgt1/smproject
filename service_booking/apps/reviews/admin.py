from django.contrib import admin
from .models import Review, Complaint

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'customer', 'rating', 'created_at')
    search_fields = ('customer__username', 'booking__id')
    list_filter = ('rating',)
    ordering = ('-created_at',)

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'description', 'status', 'created_at')
    search_fields = ('booking__id', 'description')
    list_filter = ('status',)
    ordering = ('-created_at',) 