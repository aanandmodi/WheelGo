from rest_framework import serializers
from .models import CustomerProfile, Favorite, Review, CustomerNotification
from inventory.models import Bike
from inventory.serializers import BikeSerializer


class CustomerProfileSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    
    class Meta:
        model = CustomerProfile
        fields = [
            'id', 'phone_number', 'full_name', 'email', 'avatar',
            'saved_address', 'saved_latitude', 'saved_longitude',
            'is_kyc_verified', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'phone_number', 'is_kyc_verified', 'created_at', 'updated_at']


class CreateCustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ['full_name', 'email', 'avatar', 'saved_address', 'saved_latitude', 'saved_longitude', 'is_kyc_verified']


class FavoriteSerializer(serializers.ModelSerializer):
    bike_details = BikeSerializer(source='bike', read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'bike', 'bike_details', 'created_at']
        read_only_fields = ['id', 'created_at']


class AddFavoriteSerializer(serializers.Serializer):
    bike_id = serializers.IntegerField()

    def validate_bike_id(self, value):
        if not Bike.objects.filter(id=value).exists():
            raise serializers.ValidationError("Bike not found")
        return value


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    bike_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = ['id', 'user_name', 'bike', 'bike_name', 'booking', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'user_name', 'bike_name', 'created_at']

    def get_bike_name(self, obj):
        return f"{obj.bike.brand} {obj.bike.model}"


class CreateReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['booking', 'rating', 'comment']

    def validate_booking(self, value):
        request = self.context.get('request')
        
        # Ensure user owns the booking
        if value.user != request.user:
            raise serializers.ValidationError("You can only review your own bookings")
        
        # Ensure booking is completed
        if value.status != 'completed':
            raise serializers.ValidationError("Can only review completed rides")
        
        # Ensure no existing review
        if hasattr(value, 'review'):
            raise serializers.ValidationError("You have already reviewed this booking")
        
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        validated_data['bike'] = validated_data['booking'].bike
        return super().create(validated_data)


class CustomerNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerNotification
        fields = ['id', 'notification_type', 'title', 'message', 'data', 'is_read', 'created_at']
        read_only_fields = ['id', 'notification_type', 'title', 'message', 'data', 'created_at']


class CustomerDashboardSerializer(serializers.Serializer):
    """Serializer for customer dashboard stats"""
    total_rides = serializers.IntegerField()
    upcoming_rides = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2)
    favorites_count = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()
