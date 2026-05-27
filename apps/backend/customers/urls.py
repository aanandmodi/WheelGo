from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerProfileView, FavoritesViewSet, ReviewsViewSet,
    NotificationsViewSet, CustomerDashboardView, KYCVerifyView
)

router = DefaultRouter()
router.register(r'favorites', FavoritesViewSet, basename='favorites')
router.register(r'reviews', ReviewsViewSet, basename='reviews')
router.register(r'notifications', NotificationsViewSet, basename='notifications')

urlpatterns = [
    # Profile
    path('profile/', CustomerProfileView.as_view(), name='customer-profile'),
    
    # Secure KYC Verification
    path('kyc/verify/', KYCVerifyView.as_view(), name='customer-kyc-verify'),
    
    # Dashboard
    path('dashboard/', CustomerDashboardView.as_view(), name='customer-dashboard'),
    
    # Bike reviews (public endpoint)
    path('reviews/bike/<int:bike_id>/', ReviewsViewSet.as_view({'get': 'bike_reviews'}), name='bike-reviews'),
    
    # Viewsets (Favorites, Reviews, Notifications)
    path('', include(router.urls)),
]
