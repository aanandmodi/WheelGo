from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import SendOTPView, VerifyOTPView, CheckUserExistsView, FirebaseAuthView, UpdateFCMTokenView

urlpatterns = [
    path('send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('check-user/', CheckUserExistsView.as_view(), name='check-user'),
    path('firebase-auth/', FirebaseAuthView.as_view(), name='firebase-auth'),
    path('fcm-token/', UpdateFCMTokenView.as_view(), name='update-fcm-token'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]

