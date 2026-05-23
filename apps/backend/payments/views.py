from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.conf import settings
from bookings.models import Booking
from .models import Payment
from .services import RazorpayClient

class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        booking = get_object_or_404(Booking, id=booking_id)

        # Ensure user owns the booking
        if booking.user != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        razorpay_client = RazorpayClient()
        order = razorpay_client.create_order(booking.total_amount)

        # Create localized Payment record
        payment = Payment.objects.create(
            booking=booking,
            amount=booking.total_amount,
            provider='Razorpay',
            transaction_id=order['id'],
            status='pending'
        )

        return Response({
            "order_id": order['id'],
            "amount": order['amount'],
            "currency": order['currency'],
            "key": settings.RAZORPAY_KEY_ID
        })

class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_signature = data.get('razorpay_signature')

        razorpay_client = RazorpayClient()
        if razorpay_client.verify_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
            try:
                from django.db import transaction
                from common.notifications import notify_new_booking_to_vendor
                
                with transaction.atomic():
                    payment = Payment.objects.select_for_update().get(transaction_id=razorpay_order_id)
                    payment.status = 'success'
                    payment.razorpay_payment_id = razorpay_payment_id
                    payment.save()

                    # Update Booking Status
                    booking = payment.booking
                    booking.payment_status = 'paid'
                    booking.status = 'confirmed'
                    booking.save()

                    # Update Bike Status
                    bike = booking.bike
                    bike.status = 'reserved'
                    bike.save()

                # Trigger push notification to vendor
                try:
                    notify_new_booking_to_vendor(booking)
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Failed to notify vendor of new booking: {e}")

                return Response({"message": "Payment successful"})
            except Payment.DoesNotExist:
                return Response({"error": "Payment record not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Signature verification failed"}, status=status.HTTP_400_BAD_REQUEST)

import hmac
import hashlib
import json
from django.db import transaction
from rest_framework.permissions import AllowAny

class RazorpayWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', '')
        signature = request.headers.get('X-Razorpay-Signature', '')
        body = request.body

        if not webhook_secret:
            # If no webhook secret is set in dev, accept it but log warning
            import logging
            logger = logging.getLogger(__name__)
            logger.warning("RAZORPAY_WEBHOOK_SECRET not configured. Accepting webhook without verification.")
        else:
            # Verify signature
            expected = hmac.new(
                webhook_secret.encode(),
                body,
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(expected, signature):
                return Response({"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = json.loads(body)
        except Exception:
            return Response({"error": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event.get('event')

        if event_type == 'payment.captured':
            payment_entity = event.get('payload', {}).get('payment', {}).get('entity', {})
            order_id = payment_entity.get('order_id')
            razorpay_payment_id = payment_entity.get('id')
            if order_id:
                try:
                    with transaction.atomic():
                        payment = Payment.objects.select_for_update().get(transaction_id=order_id)
                        if payment.status != 'success':
                            payment.status = 'success'
                            payment.razorpay_payment_id = razorpay_payment_id
                            payment.save()
                            
                            booking = payment.booking
                            booking.payment_status = 'paid'
                            booking.status = 'confirmed'
                            booking.save()
                            
                            # Update Bike Status
                            bike = booking.bike
                            bike.status = 'reserved'
                            bike.save()
                            
                            # Trigger push notification to vendor
                            from common.notifications import notify_new_booking_to_vendor
                            notify_new_booking_to_vendor(booking)
                except Payment.DoesNotExist:
                    pass

        elif event_type == 'payment.failed':
            payment_entity = event.get('payload', {}).get('payment', {}).get('entity', {})
            order_id = payment_entity.get('order_id')
            if order_id:
                try:
                    with transaction.atomic():
                        payment = Payment.objects.select_for_update().get(transaction_id=order_id)
                        if payment.status != 'success':
                            payment.status = 'failed'
                            payment.save()
                            
                            booking = payment.booking
                            booking.payment_status = 'failed'
                            booking.status = 'cancelled'
                            booking.save()
                            
                            # Update Bike Status back to available
                            bike = booking.bike
                            bike.status = 'available'
                            bike.save()
                except Payment.DoesNotExist:
                    pass

        return Response({"status": "ok"}, status=status.HTTP_200_OK)
