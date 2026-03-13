from django.db import models
from vendors.models import Vendor

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', null=True, blank=True)

    def __str__(self):
        return self.name

class Bike(models.Model):
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('reserved', 'Reserved'),
        ('active', 'Active'),
        ('maintenance', 'Maintenance'),
    )

    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='bikes')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='bikes')
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    number_plate = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    price_per_hour = models.DecimalField(max_digits=10, decimal_places=2)
    condition = models.CharField(max_length=50, default='Good')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    image = models.ImageField(upload_to='bikes/', null=True, blank=True)
    
    # Rating fields (updated by Review model)
    average_rating = models.DecimalField(max_digits=2, decimal_places=1, default=0.0)
    review_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.brand} {self.model} ({self.number_plate})"

