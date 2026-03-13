from rest_framework import serializers
from .models import Vendor, Earning, Payout, VendorBankDetails

class VendorSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    
    class Meta:
        model = Vendor
        fields = ['id', 'user', 'shop_name', 'address', 'latitude', 'longitude', 'is_verified', 'phone_number']
        read_only_fields = ['user', 'is_verified', 'phone_number']


class CreateVendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ['shop_name', 'address', 'latitude', 'longitude']


class VendorBankDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorBankDetails
        fields = ['id', 'account_holder_name', 'account_number', 'ifsc_code', 'bank_name', 'is_verified', 'created_at']
        read_only_fields = ['id', 'is_verified', 'created_at']
    
    def validate_ifsc_code(self, value):
        """Validate IFSC code format: 4 letters + 0 + 6 alphanumeric"""
        import re
        if not re.match(r'^[A-Z]{4}0[A-Z0-9]{6}$', value.upper()):
            raise serializers.ValidationError("Invalid IFSC format. Should be like 'SBIN0001234'")
        return value.upper()


class EarningSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    bike_name = serializers.SerializerMethodField()
    customer_phone = serializers.CharField(source='booking.user.phone_number', read_only=True)
    
    class Meta:
        model = Earning
        fields = ['id', 'booking_id', 'bike_name', 'customer_phone', 'gross_amount', 
                  'platform_fee', 'net_amount', 'status', 'created_at']
        read_only_fields = fields
    
    def get_bike_name(self, obj):
        return f"{obj.booking.bike.brand} {obj.booking.bike.model}"


class PayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = ['id', 'amount', 'utr', 'status', 'failure_reason', 'created_at', 'processed_at']
        read_only_fields = ['id', 'utr', 'status', 'failure_reason', 'created_at', 'processed_at']


class PayoutRequestSerializer(serializers.Serializer):
    """Serializer for requesting a new payout"""
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=100)
    
    def validate_amount(self, value):
        # Get vendor from context
        vendor = self.context.get('vendor')
        if vendor:
            # Calculate available balance
            from django.db.models import Sum
            pending_earnings = vendor.earnings.filter(status='pending').aggregate(
                total=Sum('net_amount')
            )['total'] or 0
            
            if value > pending_earnings:
                raise serializers.ValidationError(
                    f"Insufficient balance. Available: ₹{pending_earnings}"
                )
        return value

