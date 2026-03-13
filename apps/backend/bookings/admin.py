from django.contrib import admin
from .models import Booking

class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'bike', 'start_time', 'end_time', 'total_amount', 'status', 'payment_status')
    list_filter = ('status', 'payment_status', 'created_at')
    search_fields = ('user__phone_number', 'bike__number_plate', 'qr_code_data')
    readonly_fields = ('qr_code_data', 'qr_code_image', 'total_amount')

admin.site.register(Booking, BookingAdmin)
