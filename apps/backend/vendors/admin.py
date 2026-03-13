from django.contrib import admin
from .models import Vendor, Earning, Payout, VendorBankDetails


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['shop_name', 'user', 'is_verified', 'created_at']
    list_filter = ['is_verified', 'created_at']
    search_fields = ['shop_name', 'user__phone_number']


@admin.register(VendorBankDetails)
class VendorBankDetailsAdmin(admin.ModelAdmin):
    list_display = ['vendor', 'bank_name', 'account_number', 'is_verified']
    list_filter = ['is_verified', 'bank_name']


@admin.register(Earning)
class EarningAdmin(admin.ModelAdmin):
    list_display = ['id', 'vendor', 'booking', 'gross_amount', 'net_amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['vendor__shop_name']


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ['id', 'vendor', 'amount', 'status', 'utr', 'created_at', 'processed_at']
    list_filter = ['status', 'created_at']
    search_fields = ['vendor__shop_name', 'utr']
    actions = ['mark_as_completed']

    @admin.action(description="Mark selected payouts as completed")
    def mark_as_completed(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='completed', processed_at=timezone.now())

