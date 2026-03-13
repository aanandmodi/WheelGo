from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from bookings.models import Booking
from inventory.models import Bike
from vendors.models import Earning


class VendorDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'vendor_profile'):
            return Response({"error": "User is not a vendor"}, status=status.HTTP_400_BAD_REQUEST)
        
        vendor = user.vendor_profile
        
        # Bike Stats
        total_bikes = Bike.objects.filter(vendor=vendor).count()
        available_bikes = Bike.objects.filter(vendor=vendor, status='available').count()
        
        # Booking Stats
        pending_requests = Booking.objects.filter(bike__vendor=vendor, status='pending').count()
        active_bookings = Booking.objects.filter(bike__vendor=vendor, status='active').count()
        completed_bookings = Booking.objects.filter(bike__vendor=vendor, status='completed').count()
        
        # Earnings from new Earning model
        earnings_data = vendor.earnings.aggregate(
            total_net=Sum('net_amount'),
            pending_amount=Sum('net_amount', filter=Count('status') == 'pending')
        )
        total_earnings = earnings_data['total_net'] or 0
        
        # Pending balance (unpaid earnings)
        pending_balance = vendor.earnings.filter(status='pending').aggregate(
            total=Sum('net_amount')
        )['total'] or 0
        
        # This Week's earnings
        week_ago = timezone.now() - timedelta(days=7)
        weekly_earnings = vendor.earnings.filter(created_at__gte=week_ago).aggregate(
            total=Sum('net_amount')
        )['total'] or 0
        
        # This Month's earnings
        month_ago = timezone.now() - timedelta(days=30)
        monthly_earnings = vendor.earnings.filter(created_at__gte=month_ago).aggregate(
            total=Sum('net_amount')
        )['total'] or 0
        
        # Recent Activity (Last 5 bookings)
        recent_bookings = Booking.objects.filter(bike__vendor=vendor).order_by('-created_at')[:5]
        recent_activity_data = []
        for booking in recent_bookings:
            activity_type = "request"
            if booking.status == 'completed':
                activity_type = "completed"
            elif booking.status == 'active':
                activity_type = "active"
            elif booking.payment_status == 'paid':
                activity_type = "payment"
            
            recent_activity_data.append({
                "id": str(booking.id),
                "title": f"Booking #{booking.id}",
                "desc": f"{booking.bike.brand} {booking.bike.model}",
                "customer": booking.user.phone_number,
                "time": booking.created_at.strftime("%d %b, %H:%M"),
                "status": booking.status,
                "type": activity_type
            })
                                        
        return Response({
            # Fleet
            "total_bikes": total_bikes,
            "available_bikes": available_bikes,
            
            # Bookings
            "pending_requests": pending_requests,
            "active_rentals": active_bookings,
            "completed_rides": completed_bookings,
            
            # Earnings
            "total_earnings": float(total_earnings),
            "pending_balance": float(pending_balance),
            "weekly_earnings": float(weekly_earnings),
            "monthly_earnings": float(monthly_earnings),
            
            # Activity
            "recent_activity": recent_activity_data
        })

