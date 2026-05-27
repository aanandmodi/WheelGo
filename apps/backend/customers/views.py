from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets
from rest_framework.decorators import action
from django.db.models import Sum
from django.shortcuts import get_object_or_404

from .models import CustomerProfile, Favorite, Review, CustomerNotification
from .serializers import (
    CustomerProfileSerializer, CreateCustomerProfileSerializer,
    FavoriteSerializer, AddFavoriteSerializer,
    ReviewSerializer, CreateReviewSerializer,
    CustomerNotificationSerializer, CustomerDashboardSerializer
)
from inventory.models import Bike
from bookings.models import Booking


class CustomerProfileView(APIView):
    """Manage customer profile - get and update"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.customer_profile
            serializer = CustomerProfileSerializer(profile)
            return Response(serializer.data)
        except CustomerProfile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        """Create or update customer profile"""
        try:
            profile = request.user.customer_profile
            serializer = CreateCustomerProfileSerializer(profile, data=request.data, partial=True)
        except CustomerProfile.DoesNotExist:
            serializer = CreateCustomerProfileSerializer(data=request.data)

        if serializer.is_valid():
            if hasattr(request.user, 'customer_profile'):
                serializer.save()
            else:
                serializer.save(user=request.user)
            
            # Return full profile
            full_serializer = CustomerProfileSerializer(request.user.customer_profile)
            return Response(full_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FavoritesViewSet(viewsets.ViewSet):
    """Manage customer favorite bikes"""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """List all favorite bikes"""
        favorites = Favorite.objects.filter(user=request.user).select_related('bike', 'bike__vendor')
        serializer = FavoriteSerializer(favorites, many=True, context={'request': request})
        return Response(serializer.data)

    def create(self, request):
        """Add a bike to favorites"""
        serializer = AddFavoriteSerializer(data=request.data)
        if serializer.is_valid():
            bike_id = serializer.validated_data['bike_id']
            bike = Bike.objects.get(id=bike_id)
            
            # Check if already favorited
            if Favorite.objects.filter(user=request.user, bike=bike).exists():
                return Response(
                    {"error": "Bike already in favorites"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            favorite = Favorite.objects.create(user=request.user, bike=bike)
            return Response(
                {"message": "Added to favorites", "id": favorite.id},
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        """Remove a bike from favorites by bike_id"""
        try:
            favorite = Favorite.objects.get(user=request.user, bike_id=pk)
            favorite.delete()
            return Response({"message": "Removed from favorites"}, status=status.HTTP_200_OK)
        except Favorite.DoesNotExist:
            return Response(
                {"error": "Bike not in favorites"}, 
                status=status.HTTP_404_NOT_FOUND
            )


class ReviewsViewSet(viewsets.ViewSet):
    """Manage customer reviews"""
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        """Submit a review for a completed booking"""
        serializer = CreateReviewSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            review = serializer.save()
            response_serializer = ReviewSerializer(review)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='bike/(?P<bike_id>[^/.]+)')
    def bike_reviews(self, request, bike_id=None):
        """List all reviews for a specific bike"""
        reviews = Review.objects.filter(bike_id=bike_id).select_related('user')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def list(self, request):
        """List all reviews by the current user"""
        reviews = Review.objects.filter(user=request.user).select_related('bike')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)


class NotificationsViewSet(viewsets.ViewSet):
    """Manage customer notifications"""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """List all notifications"""
        notifications = CustomerNotification.objects.filter(user=request.user)
        serializer = CustomerNotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='read')
    def mark_read(self, request, pk=None):
        """Mark a single notification as read"""
        try:
            notification = CustomerNotification.objects.get(id=pk, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({"message": "Marked as read"})
        except CustomerNotification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], url_path='read-all')
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        count = CustomerNotification.objects.filter(
            user=request.user, 
            is_read=False
        ).update(is_read=True)
        return Response({"message": f"Marked {count} notifications as read"})


class CustomerDashboardView(APIView):
    """Customer dashboard with quick stats"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Booking stats
        bookings = Booking.objects.filter(user=user)
        total_rides = bookings.filter(status='completed').count()
        upcoming_rides = bookings.filter(status__in=['pending', 'confirmed']).count()
        
        # Total spent
        total_spent = bookings.filter(
            status='completed', 
            payment_status='paid'
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Favorites count
        favorites_count = Favorite.objects.filter(user=user).count()
        
        # Unread notifications
        unread_notifications = CustomerNotification.objects.filter(
            user=user, 
            is_read=False
        ).count()
        
        data = {
            'total_rides': total_rides,
            'upcoming_rides': upcoming_rides,
            'total_spent': total_spent,
            'favorites_count': favorites_count,
            'unread_notifications': unread_notifications
        }
        
        serializer = CustomerDashboardSerializer(data)
        return Response(serializer.data)


# Utility function to create notifications (used by other apps)
def create_customer_notification(user, notification_type, title, message, data=None):
    """
    Helper function to create customer notifications.
    Can be called from bookings, payments, etc.
    """
    return CustomerNotification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        data=data or {}
    )


class KYCVerifyView(APIView):
    """Secure endpoint for customer KYC verification"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            profile, created = CustomerProfile.objects.get_or_create(user=request.user)
            profile.is_kyc_verified = True
            profile.save(update_fields=['is_kyc_verified'])
            return Response({
                "status": "success",
                "message": "KYC verified successfully",
                "is_kyc_verified": True
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
