from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    KYCInitiateView, KYCCheckStatusView, VendorProfileView,
    VendorBankDetailsView, EarningsViewSet, PayoutsViewSet
)
from .dashboard_views import VendorDashboardStatsView

router = DefaultRouter()
router.register(r'earnings', EarningsViewSet, basename='earnings')
router.register(r'payouts', PayoutsViewSet, basename='payouts')

urlpatterns = [
    # Profile & KYC
    path('profile/', VendorProfileView.as_view(), name='vendor-profile'),
    path('kyc/initiate/', KYCInitiateView.as_view(), name='kyc-initiate'),
    path('kyc/status/', KYCCheckStatusView.as_view(), name='kyc-status'),
    
    # Dashboard
    path('dashboard/stats/', VendorDashboardStatsView.as_view(), name='vendor-dashboard-stats'),
    
    # Bank Details
    path('bank-details/', VendorBankDetailsView.as_view(), name='vendor-bank-details'),
    
    # Viewsets (Earnings, Payouts)
    path('', include(router.urls)),
]

