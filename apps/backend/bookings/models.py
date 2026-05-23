import os
from django.db import models
from django.conf import settings
from inventory.models import Bike
import uuid
import qrcode
from io import BytesIO
from django.core.files import File

class Booking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    bike = models.ForeignKey(Bike, on_delete=models.CASCADE, related_name='bookings')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # QR Code for Starting Ride
    qr_code_data = models.CharField(max_length=255, unique=True, blank=True)
    qr_code_image = models.ImageField(upload_to='qrcodes/', blank=True)
    
    # Rejection/completion fields
    rejection_reason = models.TextField(blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)  # When ride actually ended
    
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.qr_code_data:
            self.qr_code_data = str(uuid.uuid4()) # Unique Token
        
        # Generate QR Image only if not exists and status is confirmed or active
        if not self.qr_code_image and self.status in ['confirmed', 'active']:
            qr_image = qrcode.make(self.qr_code_data)
            canvas = BytesIO()
            qr_image.save(canvas, format='PNG')
            file_name = f'qr_{self.qr_code_data}.png'
            
            # If Cloudinary details are configured in environment, upload directly
            if not settings.DEBUG and os.environ.get('CLOUDINARY_CLOUD_NAME'):
                import cloudinary.uploader
                canvas.seek(0)
                try:
                    result = cloudinary.uploader.upload(
                        canvas,
                        folder='wheelgo/qr_codes',
                        public_id=f'booking_{self.id or "temp"}',
                        format='png'
                    )
                    self.qr_code_image = result['secure_url']
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Cloudinary upload failed: {e}")
                    self.qr_code_image.save(file_name, File(canvas), save=False)
            else:
                self.qr_code_image.save(file_name, File(canvas), save=False)
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking {self.id} - {self.user.phone_number} - {self.bike.brand}"
