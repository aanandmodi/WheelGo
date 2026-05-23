import os
import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

_firebase_initialized = False

def _init_firebase():
    global _firebase_initialized
    if not _firebase_initialized and not firebase_admin._apps:
        cred_path = getattr(settings, 'FIREBASE_SERVICE_ACCOUNT_PATH', 'firebase-service-account.json')
        if cred_path and os.path.exists(cred_path):
            try:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                _firebase_initialized = True
            except Exception as e:
                logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        else:
            logger.warning(f"Firebase credentials not found at path: {cred_path}. Firebase notifications will operate in fallback print mode.")

def send_push_notification(fcm_token: str, title: str, body: str, data: dict = None) -> bool:
    # Print stub fallback for local debugging
    print(f"--- FCM PUSH NOTIFICATION ---")
    print(f"To Token: {fcm_token}")
    print(f"Title: {title}")
    print(f"Body: {body}")
    print(f"Data: {data}")
    print(f"-----------------------------")

    _init_firebase()
    if not fcm_token or not _firebase_initialized:
        logger.warning("FCM token empty or Firebase Admin SDK not initialized - push skipped.")
        return False
        
    try:
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            token=fcm_token,
            android=messaging.AndroidConfig(priority='high'),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(sound='default', badge=1)
                )
            )
        )
        messaging.send(message)
        return True
    except Exception as e:
        logger.error(f"FCM send failed: {e}")
        return False

# Convenience helpers - to be used across apps/views
def notify_booking_confirmed(booking):
    if booking.user.fcm_token:
        send_push_notification(
            fcm_token=booking.user.fcm_token,
            title="Booking Confirmed! 🎉",
            body=f"Your {booking.bike.brand} {booking.bike.model} booking is confirmed. Show QR at pickup.",
            data={"type": "booking_confirmed", "booking_id": str(booking.id)}
        )

def notify_booking_rejected(booking):
    if booking.user.fcm_token:
        send_push_notification(
            fcm_token=booking.user.fcm_token,
            title="Booking Rejected ❌",
            body=f"Your booking for {booking.bike.brand} {booking.bike.model} was rejected. Try another bike.",
            data={"type": "booking_rejected", "booking_id": str(booking.id)}
        )

def notify_new_booking_to_vendor(booking):
    # Vendor profile user
    vendor_user = booking.bike.vendor.user
    if vendor_user.fcm_token:
        send_push_notification(
            fcm_token=vendor_user.fcm_token,
            title="New Booking Request! 🏍️",
            body=f"New booking for {booking.bike.brand} {booking.bike.model}. Tap to accept or reject.",
            data={"type": "new_booking", "booking_id": str(booking.id)}
        )

def notify_ride_completed(booking):
    if booking.user.fcm_token:
        send_push_notification(
            fcm_token=booking.user.fcm_token,
            title="Ride Complete! ⭐",
            body=f"How was your {booking.bike.brand} {booking.bike.model} ride? Rate your experience.",
            data={"type": "ride_completed", "booking_id": str(booking.id)}
        )
