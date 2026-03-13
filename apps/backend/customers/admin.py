from django.contrib import admin
from .models import CustomerProfile, Favorite, Review, CustomerNotification


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'full_name', 'email', 'is_kyc_verified', 'created_at']
    list_filter = ['is_kyc_verified', 'created_at']
    search_fields = ['user__phone_number', 'full_name', 'email']


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'bike', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__phone_number', 'bike__brand', 'bike__model']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'bike', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['user__phone_number', 'bike__brand', 'comment']


@admin.register(CustomerNotification)
class CustomerNotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['user__phone_number', 'title', 'message']
