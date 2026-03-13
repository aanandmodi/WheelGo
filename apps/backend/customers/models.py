from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from inventory.models import Bike


class CustomerProfile(models.Model):
    """Extended profile information for customers"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='customer_profile'
    )
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    full_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    saved_address = models.TextField(blank=True)
    saved_latitude = models.FloatField(null=True, blank=True)
    saved_longitude = models.FloatField(null=True, blank=True)
    is_kyc_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.phone_number}"


class Favorite(models.Model):
    """Customer favorite bikes for quick access"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='favorites'
    )
    bike = models.ForeignKey(
        Bike, 
        on_delete=models.CASCADE, 
        related_name='favorited_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'bike')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.phone_number} -> {self.bike.brand} {self.bike.model}"


class Review(models.Model):
    """Customer reviews for bikes after ride completion"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='reviews'
    )
    bike = models.ForeignKey(
        Bike, 
        on_delete=models.CASCADE, 
        related_name='reviews'
    )
    booking = models.OneToOneField(
        'bookings.Booking', 
        on_delete=models.CASCADE, 
        related_name='review'
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.user.phone_number} - {self.rating}★"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update bike average rating
        self._update_bike_rating()

    def _update_bike_rating(self):
        """Recalculate and update bike's average rating"""
        from django.db.models import Avg
        reviews = self.bike.reviews.all()
        avg = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        self.bike.average_rating = round(avg, 1)
        self.bike.review_count = reviews.count()
        self.bike.save(update_fields=['average_rating', 'review_count'])


class CustomerNotification(models.Model):
    """Notifications for customer app"""
    NOTIFICATION_TYPES = (
        ('booking_confirmed', 'Booking Confirmed'),
        ('booking_rejected', 'Booking Rejected'),
        ('ride_started', 'Ride Started'),
        ('ride_completed', 'Ride Completed'),
        ('payment_success', 'Payment Success'),
        ('payment_failed', 'Payment Failed'),
        ('promo', 'Promotional'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='customer_notifications'
    )
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)  # For deep linking (booking_id, etc.)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.phone_number}"
