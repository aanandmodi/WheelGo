from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
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
            "key": "rzp_test_PLACEHOLDER" # Should ideally come from settings/env
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
                payment = Payment.objects.get(transaction_id=razorpay_order_id)
                payment.status = 'success'
                payment.save()

                # Update Booking Status
                booking = payment.booking
                booking.payment_status = 'paid'
                booking.status = 'confirmed'
                booking.save()

                return Response({"message": "Payment successful"})
            except Payment.DoesNotExist:
                return Response({"error": "Payment record not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Signature verification failed"}, status=status.HTTP_400_BAD_REQUEST)
