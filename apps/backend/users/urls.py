from django.urls import path
from .views import SendOTPView, VerifyOTPView, CheckUserExistsView, FirebaseAuthView

urlpatterns = [
    path('send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('check-user/', CheckUserExistsView.as_view(), name='check-user'),
    path('firebase-auth/', FirebaseAuthView.as_view(), name='firebase-auth'),
]

