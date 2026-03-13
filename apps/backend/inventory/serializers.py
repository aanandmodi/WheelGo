from rest_framework import serializers
from .models import Category, Bike
from vendors.models import Vendor


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class BikeSerializer(serializers.ModelSerializer):
    """Enhanced serializer with vendor details and favorites status"""
    vendor_name = serializers.CharField(source='vendor.shop_name', read_only=True)
    vendor_address = serializers.CharField(source='vendor.address', read_only=True)
    vendor_latitude = serializers.FloatField(source='vendor.latitude', read_only=True)
    vendor_longitude = serializers.FloatField(source='vendor.longitude', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_favorited = serializers.SerializerMethodField()
    
    class Meta:
        model = Bike
        fields = [
            'id', 'vendor', 'vendor_name', 'vendor_address', 'vendor_latitude', 'vendor_longitude',
            'category', 'category_name', 'brand', 'model', 'number_plate', 'description',
            'price_per_hour', 'condition', 'status', 'image',
            'average_rating', 'review_count', 'is_favorited', 'created_at'
        ]
        read_only_fields = ['vendor', 'average_rating', 'review_count']

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorited_by.filter(user=request.user).exists()
        return False


class BikeCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating bikes (vendor use)"""
    class Meta:
        model = Bike
        fields = ['category', 'brand', 'model', 'number_plate', 'description', 
                  'price_per_hour', 'condition', 'status', 'image']
