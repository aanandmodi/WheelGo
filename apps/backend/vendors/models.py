from django.db import models
from django.conf import settings

class Vendor(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vendor_profile')
    shop_name = models.CharField(max_length=255)
    address = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.shop_name} ({self.user.phone_number})"


class VendorBankDetails(models.Model):
    """Bank account information for vendor payouts"""
    vendor = models.OneToOneField(Vendor, on_delete=models.CASCADE, related_name='bank_details')
    account_holder_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=20)
    ifsc_code = models.CharField(max_length=11)
    bank_name = models.CharField(max_length=100)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.bank_name} - {self.account_number[-4:]}"


class Earning(models.Model):
    """Tracks vendor earnings from completed bookings"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
    )
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='earnings')
    booking = models.OneToOneField('bookings.Booking', on_delete=models.CASCADE, related_name='earning')
    gross_amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2)  # 15% commission
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Auto-calculate platform fee (15%) and net amount
        if self.gross_amount and not self.platform_fee:
            from decimal import Decimal
            self.platform_fee = self.gross_amount * Decimal('0.15')
            self.net_amount = self.gross_amount - self.platform_fee
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Earning #{self.id} - ₹{self.net_amount} ({self.status})"


class Payout(models.Model):
    """Tracks vendor payout requests and transactions"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='payouts')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    utr = models.CharField(max_length=100, blank=True)  # Bank transaction reference
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    failure_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Payout #{self.id} - ₹{self.amount} ({self.status})"
