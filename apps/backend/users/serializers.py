from rest_framework import serializers
from .models import User, PhoneOTP

class UserSerializer(serializers.ModelSerializer):
    is_kyc_verified = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'phone_number', 'full_name', 'role', 'is_active', 'is_kyc_verified')

    def get_is_kyc_verified(self, obj):
        if hasattr(obj, 'customer_profile'):
            return obj.customer_profile.is_kyc_verified
        return False

class OTPRequestSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)

class OTPVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)
    otp = serializers.CharField(max_length=6)
