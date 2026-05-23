from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
import random
import requests as http_requests
import logging
from .models import User, PhoneOTP
from .serializers import OTPRequestSerializer, OTPVerifySerializer, UserSerializer

logger = logging.getLogger(__name__)

def send_otp_via_sms(phone_number: str, otp: str) -> bool:
    if settings.DEBUG:
        return True  # In dev, skip real SMS

    url = "https://api.msg91.com/api/v5/otp"
    payload = {
        "template_id": settings.MSG91_TEMPLATE_ID,
        "mobile": f"91{phone_number}",
        "authkey": settings.MSG91_AUTH_KEY,
        "otp": otp,
        "otp_expiry": 10,
    }
    try:
        resp = http_requests.post(url, json=payload, timeout=5)
        return resp.status_code == 200
    except Exception as e:
        logger.error(f"SMS send failed: {e}")
        return False

class SendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number'].strip()
            
            # Rate limit: max 3 OTPs per 10 minutes
            now = timezone.now()
            ten_min_ago = now - timedelta(minutes=10)
            
            phone_otp, created = PhoneOTP.objects.get_or_create(phone_number=phone_number)
            
            if not created and phone_otp.created_at >= ten_min_ago:
                if phone_otp.count >= 3:
                    return Response(
                        {"error": "Too many OTP requests. Wait 10 minutes."},
                        status=status.HTTP_429_TOO_MANY_REQUESTS
                    )
                phone_otp.count += 1
            else:
                phone_otp.count = 1  # Reset count for new window
            
            # Generate 6 digit OTP
            otp = str(random.randint(100000, 999999))
            phone_otp.otp = otp
            phone_otp.verified = False
            phone_otp.save()
            
            # Mock sending OTP (Print to console)
            print(f"OTP for {phone_number}: {otp}", flush=True)
            logger.warning(f"OTP for {phone_number}: {otp}")
            
            sms_sent = True
            if not settings.DEBUG:
                sms_sent = send_otp_via_sms(phone_number, otp)
                
            if not sms_sent:
                return Response(
                    {"error": "Failed to send OTP SMS"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            if settings.DEBUG:
                return Response({
                    "message": "OTP sent successfully", 
                    "otp": otp # Returning OTP for dev/demo purposes
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "message": "OTP sent to your phone"
                }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            otp = serializer.validated_data['otp']
            
            try:
                phone_otp = PhoneOTP.objects.get(phone_number=phone_number)
            except PhoneOTP.DoesNotExist:
                return Response({"error": "OTP not found for this number"}, status=status.HTTP_400_BAD_REQUEST)
            
            if phone_otp.otp == otp:
                phone_otp.verified = True
                phone_otp.count = 0  # Reset rate limit count on success
                phone_otp.save()
                
                # Get or Create User
                user, created = User.objects.get_or_create(phone_number=phone_number)
                
                # Generate Tokens
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": UserSerializer(user).data,
                    "new_user": created,
                    "has_vendor_profile": hasattr(user, 'vendor_profile')
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CheckUserExistsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone_number = request.data.get('phone_number')
        if not phone_number:
            return Response({"error": "Phone number required"}, status=status.HTTP_400_BAD_REQUEST)
        
        exists = User.objects.filter(phone_number=phone_number).exists()
        return Response({"exists": exists}, status=status.HTTP_200_OK)

class FirebaseAuthView(APIView):
    """
    Authenticate users via Firebase ID token or Google OAuth.
    Used for Firebase Phone Auth and Google Sign-In.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        firebase_token = request.data.get('firebase_token')
        email = request.data.get('email')
        name = request.data.get('name')
        google_id = request.data.get('google_id')
        provider = request.data.get('provider', 'phone')
        
        # If we have Google OAuth data directly, use it
        if provider == 'google' and email:
            return self.handle_google_oauth(email, name, google_id)
        
        # Otherwise try Firebase token verification
        if not firebase_token:
            return Response(
                {"error": "firebase_token or email is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Import here to avoid circular imports
            from config.firebase_config import verify_firebase_token
            
            # Verify Firebase token
            firebase_user = verify_firebase_token(firebase_token)
            
            # Get phone number or email
            phone_number = firebase_user.get('phone_number')
            email = firebase_user.get('email')
            
            if not phone_number and not email:
                return Response(
                    {"error": "No phone number or email in token"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get or create user
            if phone_number:
                clean_phone = phone_number.replace('+91', '').replace('+', '')
                user, created = User.objects.get_or_create(
                    phone_number=clean_phone,
                    defaults={'full_name': ''}
                )
            else:
                user, created = User.objects.get_or_create(
                    phone_number=email[:15],
                    defaults={'full_name': email.split('@')[0]}
                )
            
            return self.generate_response(user, created, firebase_user.get('provider', 'phone'))
            
        except ValueError as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {"error": f"Authentication failed: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def handle_google_oauth(self, email, name, google_id):
        """Handle direct Google OAuth (without Firebase)"""
        phone_identifier = f"g{google_id[:14]}" if google_id else email[:15]
        
        user, created = User.objects.get_or_create(
            phone_number=phone_identifier,
            defaults={
                'full_name': name or email.split('@')[0],
                'role': 'customer'
            }
        )
        
        # Update name if it was empty
        if not user.full_name and name:
            user.full_name = name
            user.save()
        
        return self.generate_response(user, created, 'google')
    
    def generate_response(self, user, created, provider):
        """Generate JWT response for authenticated user"""
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
            "new_user": created,
            "has_vendor_profile": hasattr(user, 'vendor_profile'),
            "auth_provider": provider
        }, status=status.HTTP_200_OK)

class UpdateFCMTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('fcm_token')
        if not token:
            return Response({"error": "fcm_token required"}, status=status.HTTP_400_BAD_REQUEST)
        request.user.fcm_token = token
        request.user.save(update_fields=['fcm_token'])
        return Response({"message": "FCM token updated"}, status=status.HTTP_200_OK)
