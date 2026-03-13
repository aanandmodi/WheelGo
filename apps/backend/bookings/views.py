from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Booking
from .serializers import BookingSerializer, BookingCreateSerializer, BookingListSerializer


class BookingViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        elif self.action == 'list':
            return BookingListSerializer
        return BookingSerializer

    def get_queryset(self):
        """
        User sees their bookings, Vendor sees bookings for their bikes.
        Supports filtering by status and quick filters (upcoming, past).
        """
        user = self.request.user
        
        # Base queryset based on user role
        if hasattr(user, 'role') and user.role == 'vendor':
            queryset = Booking.objects.filter(bike__vendor__user=user)
        else:
            queryset = Booking.objects.filter(user=user)
        
        # Optimize with select_related
        queryset = queryset.select_related('bike', 'bike__vendor', 'bike__vendor__user')
        
        # Filter by status (comma-separated)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            statuses = status_filter.split(',')
            queryset = queryset.filter(status__in=statuses)
        
        # Quick filters
        filter_type = self.request.query_params.get('filter')
        if filter_type == 'upcoming':
            queryset = queryset.filter(status__in=['pending', 'confirmed'])
        elif filter_type == 'active':
            queryset = queryset.filter(status='active')
        elif filter_type == 'past':
            queryset = queryset.filter(status__in=['completed', 'cancelled'])
        
        # Filter by payment status
        payment_status = self.request.query_params.get('payment_status')
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        
        return queryset.order_by('-created_at')

    def _check_vendor_owns_booking(self, request, booking):
        """Helper to verify vendor ownership of booking's bike"""
        if not hasattr(request.user, 'vendor_profile'):
            return False
        return booking.bike.vendor == request.user.vendor_profile

    def _send_customer_notification(self, booking, notification_type, title, message):
        """Helper to send customer notifications"""
        try:
            from customers.views import create_customer_notification
            create_customer_notification(
                user=booking.user,
                notification_type=notification_type,
                title=title,
                message=message,
                data={'booking_id': booking.id}
            )
        except Exception:
            pass

    @action(detail=True, methods=['post'], url_path='accept')
    def accept_booking(self, request, pk=None):
        """
        Vendor accepts a pending booking request.
        Requires payment to be completed first in a real flow.
        """
        booking = self.get_object()
        
        # Verify vendor owns this bike
        if not self._check_vendor_owns_booking(request, booking):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        if booking.status != 'pending':
            return Response(
                {"error": f"Cannot accept a booking with status '{booking.status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # In production, check payment status before confirming
        # For now, accept directly (payment can be pending for demo)
        booking.status = 'confirmed'
        booking.save()
        
        # Notify customer
        self._send_customer_notification(
            booking, 
            'booking_confirmed',
            'Booking Confirmed!',
            f'Your booking for {booking.bike.brand} {booking.bike.model} has been confirmed by the vendor.'
        )
        
        return Response({
            "message": "Booking accepted successfully",
            "booking_id": booking.id,
            "status": booking.status
        })

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_booking(self, request, pk=None):
        """Vendor rejects a pending booking request with a reason."""
        booking = self.get_object()
        
        if not self._check_vendor_owns_booking(request, booking):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        if booking.status not in ['pending', 'confirmed']:
            return Response(
                {"error": f"Cannot reject a booking with status '{booking.status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', 'No reason provided')
        booking.status = 'cancelled'
        booking.rejection_reason = reason
        booking.save()
        
        # Notify customer
        self._send_customer_notification(
            booking,
            'booking_rejected',
            'Booking Rejected',
            f'Your booking for {booking.bike.brand} {booking.bike.model} was rejected. Reason: {reason}'
        )
        
        # TODO: Trigger refund if payment was made
        
        return Response({
            "message": "Booking rejected",
            "booking_id": booking.id,
            "reason": reason
        })

    @action(detail=True, methods=['post'], url_path='complete')
    def complete_ride(self, request, pk=None):
        """
        End an active ride and create earning record for vendor.
        """
        booking = self.get_object()
        
        if not self._check_vendor_owns_booking(request, booking):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        if booking.status != 'active':
            return Response(
                {"error": f"Cannot complete a ride with status '{booking.status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'completed'
        booking.actual_end_time = timezone.now()
        booking.save()
        
        # Create earning record for vendor
        from vendors.models import Earning
        Earning.objects.create(
            vendor=booking.bike.vendor,
            booking=booking,
            gross_amount=booking.total_amount
        )
        
        # Notify customer
        self._send_customer_notification(
            booking,
            'ride_completed',
            'Ride Completed!',
            f'Your ride on {booking.bike.brand} {booking.bike.model} has been completed. Leave a review!'
        )
        
        return Response({
            "message": "Ride completed successfully",
            "booking_id": booking.id,
            "completed_at": booking.actual_end_time
        })

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_booking(self, request, pk=None):
        """Customer or Vendor cancels a booking before ride starts."""
        booking = self.get_object()
        user = request.user
        
        # Check if user is customer (owner) or vendor (bike owner)
        is_customer = booking.user == user
        is_vendor = self._check_vendor_owns_booking(request, booking)
        
        if not is_customer and not is_vendor:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        if booking.status in ['active', 'completed', 'cancelled']:
            return Response(
                {"error": f"Cannot cancel a booking with status '{booking.status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', 'Cancelled by user')
        booking.status = 'cancelled'
        booking.rejection_reason = reason
        booking.save()
        
        # TODO: Trigger refund if payment was made
        
        return Response({
            "message": "Booking cancelled",
            "booking_id": booking.id,
            "reason": reason
        })

    @action(detail=False, methods=['post'], url_path='scan-qr')
    def scan_qr(self, request):
        """Vendor scans QR code to start the ride."""
        qr_data = request.data.get('qr_code')
        if not qr_data:
            return Response({"error": "QR code data required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            booking = Booking.objects.get(qr_code_data=qr_data)
        except Booking.DoesNotExist:
            return Response({"error": "Invalid QR Code"}, status=status.HTTP_404_NOT_FOUND)
        
        # Verify vendor owns this bike
        if not self._check_vendor_owns_booking(request, booking):
            return Response({"error": "This booking is not for your bike"}, status=status.HTTP_403_FORBIDDEN)
        
        if booking.status != 'confirmed':
            return Response(
                {"error": f"Booking is not ready to start (Status: {booking.status})"},
                status=status.HTTP_400_BAD_REQUEST
            )
             
        booking.status = 'active'
        booking.save()
        
        # Notify customer
        self._send_customer_notification(
            booking,
            'ride_started',
            'Ride Started!',
            f'Your ride on {booking.bike.brand} {booking.bike.model} has started. Ride safe!'
        )
        
        return Response({
            "message": "Ride Started Successfully!",
            "booking_id": booking.id,
            "bike": f"{booking.bike.brand} {booking.bike.model}",
            "customer_phone": booking.user.phone_number
        })

    @action(detail=True, methods=['get'], url_path='qr-code')
    def get_qr_code(self, request, pk=None):
        """Customer gets the QR code for their confirmed booking."""
        booking = self.get_object()
        
        # Verify customer owns this booking
        if booking.user != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        if booking.status not in ['confirmed', 'active']:
            return Response(
                {"error": "QR code is only available for confirmed bookings"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            "qr_code_data": booking.qr_code_data,
            "qr_code_image": request.build_absolute_uri(booking.qr_code_image.url) if booking.qr_code_image else None,
            "booking_id": booking.id,
            "status": booking.status
        })
