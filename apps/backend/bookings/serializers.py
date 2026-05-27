from rest_framework import serializers
from .models import Booking
from inventory.models import Bike
from django.db.models import Q


class BookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bookings (customer use)"""
    class Meta:
        model = Booking
        fields = ['bike', 'start_time', 'end_time']

    def validate(self, data):
        user = self.context['request'].user
        bike = data['bike']
        start_time = data['start_time']
        end_time = data['end_time']

        if user == bike.vendor.user:
            raise serializers.ValidationError("You cannot book your own bike.")
        if hasattr(user, 'role') and user.role != 'customer':
            raise serializers.ValidationError("Only customers can create bookings.")

        if start_time >= end_time:
            raise serializers.ValidationError("End time must be after start time")

        # Check bike is available
        if bike.status != 'available':
            raise serializers.ValidationError(f"Bike is not available (status: {bike.status})")

        # Check for overlapping bookings
        overlapping_bookings = Booking.objects.filter(
            bike=bike,
            status__in=['confirmed', 'active'],
        ).filter(
            Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
        )
        
        if overlapping_bookings.exists():
            raise serializers.ValidationError("Bike is not available for this time slot")

        return data

    def create(self, validated_data):
        from django.db import transaction
        from customers.views import create_customer_notification
        
        bike_obj = validated_data['bike']
        start_time = validated_data['start_time']
        end_time = validated_data['end_time']
        
        with transaction.atomic():
            # Lock the bike row in DB to serialize booking creation on the same bike
            bike = Bike.objects.select_for_update().get(id=bike_obj.id)
            
            # Check overlap INSIDE the database lock
            overlapping = Booking.objects.filter(
                bike=bike,
                status__in=['pending', 'confirmed', 'active'],
                start_time__lt=end_time,
                end_time__gt=start_time,
            ).exists()
            
            if overlapping:
                raise serializers.ValidationError("Bike is not available for this time slot.")
                
            # Calculate total amount
            duration = end_time - start_time
            hours = duration.total_seconds() / 3600
            total_amount = float(bike.price_per_hour) * hours
            
            validated_data['total_amount'] = total_amount
            validated_data['user'] = self.context['request'].user
            
            booking = super().create(validated_data)
        
        # Create customer notification (outside the transaction lock to prevent holding lock during external calls)
        try:
            create_customer_notification(
                user=booking.user,
                notification_type='booking_confirmed',
                title='Booking Created!',
                message=f'Your booking for {booking.bike.brand} {booking.bike.model} is pending. Complete payment to confirm.',
                data={'booking_id': booking.id}
            )
        except Exception:
            pass  # Don't fail booking if notification fails
        
        return booking


class BookingSerializer(serializers.ModelSerializer):
    """Enhanced serializer for viewing bookings with bike and vendor details"""
    bike_brand = serializers.CharField(source='bike.brand', read_only=True)
    bike_model = serializers.CharField(source='bike.model', read_only=True)
    bike_image = serializers.ImageField(source='bike.image', read_only=True)
    bike_number_plate = serializers.CharField(source='bike.number_plate', read_only=True)
    vendor_name = serializers.CharField(source='bike.vendor.shop_name', read_only=True)
    vendor_phone = serializers.CharField(source='bike.vendor.user.phone_number', read_only=True)
    vendor_address = serializers.CharField(source='bike.vendor.address', read_only=True)
    vendor_latitude = serializers.FloatField(source='bike.vendor.latitude', read_only=True)
    vendor_longitude = serializers.FloatField(source='bike.vendor.longitude', read_only=True)
    customer_name = serializers.CharField(source='user.full_name', read_only=True)
    customer_phone = serializers.CharField(source='user.phone_number', read_only=True)
    can_cancel = serializers.SerializerMethodField()
    can_review = serializers.SerializerMethodField()
    duration_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'customer_name', 'customer_phone', 'bike', 'bike_brand', 'bike_model', 'bike_image', 'bike_number_plate',
            'vendor_name', 'vendor_phone', 'vendor_address', 'vendor_latitude', 'vendor_longitude',
            'start_time', 'end_time', 'duration_hours', 'total_amount',
            'status', 'payment_status', 'qr_code_image',
            'rejection_reason', 'actual_end_time',
            'can_cancel', 'can_review', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'total_amount', 'status', 'payment_status', 
                          'qr_code_data', 'qr_code_image', 'rejection_reason', 
                          'actual_end_time', 'created_at']

    def get_can_cancel(self, obj):
        """Check if booking can be cancelled"""
        return obj.status in ['pending', 'confirmed']
    
    def get_can_review(self, obj):
        """Check if booking can be reviewed"""
        return obj.status == 'completed' and not hasattr(obj, 'review')
    
    def get_duration_hours(self, obj):
        """Calculate booking duration in hours"""
        duration = obj.end_time - obj.start_time
        return round(duration.total_seconds() / 3600, 1)


class BookingListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing bookings"""
    bike_brand = serializers.CharField(source='bike.brand', read_only=True)
    bike_model = serializers.CharField(source='bike.model', read_only=True)
    bike_image = serializers.ImageField(source='bike.image', read_only=True)
    vendor_name = serializers.CharField(source='bike.vendor.shop_name', read_only=True)
    customer_name = serializers.CharField(source='user.full_name', read_only=True)
    customer_phone = serializers.CharField(source='user.phone_number', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'bike_brand', 'bike_model', 'bike_image', 'vendor_name',
            'customer_name', 'customer_phone',
            'start_time', 'end_time', 'total_amount', 'status', 'payment_status', 'created_at'
        ]
