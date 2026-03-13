from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets
from rest_framework.decorators import action
from django.db.models import Sum
from .models import Vendor, Earning, Payout, VendorBankDetails
from .serializers import (
    VendorSerializer, CreateVendorSerializer, 
    EarningSerializer, PayoutSerializer, PayoutRequestSerializer,
    VendorBankDetailsSerializer
)
from .kyc_services import DigiLockerClient


class VendorProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if hasattr(request.user, 'vendor_profile'):
            serializer = VendorSerializer(request.user.vendor_profile)
            return Response(serializer.data)
        return Response({"error": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        # Create or Update
        if hasattr(request.user, 'vendor_profile'):
            serializer = CreateVendorSerializer(request.user.vendor_profile, data=request.data, partial=True)
        else:
            serializer = CreateVendorSerializer(data=request.data)

        if serializer.is_valid():
            if not hasattr(request.user, 'vendor_profile'):
                serializer.save(user=request.user)
            else:
                serializer.save()
            
            # Return full profile
            full_serializer = VendorSerializer(request.user.vendor_profile)
            return Response(full_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorBankDetailsView(APIView):
    """Manage vendor bank account details for payouts"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not hasattr(request.user, 'vendor_profile'):
            return Response({"error": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            bank_details = request.user.vendor_profile.bank_details
            serializer = VendorBankDetailsSerializer(bank_details)
            return Response(serializer.data)
        except VendorBankDetails.DoesNotExist:
            return Response({"error": "Bank details not found"}, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request):
        if not hasattr(request.user, 'vendor_profile'):
            return Response({"error": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        vendor = request.user.vendor_profile
        
        # Check if bank details already exist
        if hasattr(vendor, 'bank_details'):
            serializer = VendorBankDetailsSerializer(vendor.bank_details, data=request.data, partial=True)
        else:
            serializer = VendorBankDetailsSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(vendor=vendor)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EarningsViewSet(viewsets.ReadOnlyModelViewSet):
    """List and view vendor earnings"""
    serializer_class = EarningSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if not hasattr(self.request.user, 'vendor_profile'):
            return Earning.objects.none()
        return self.request.user.vendor_profile.earnings.order_by('-created_at')
    
    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """Get earnings summary with totals"""
        if not hasattr(request.user, 'vendor_profile'):
            return Response({"error": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        vendor = request.user.vendor_profile
        
        # Calculate totals
        totals = vendor.earnings.aggregate(
            total_gross=Sum('gross_amount'),
            total_fees=Sum('platform_fee'),
            total_net=Sum('net_amount')
        )
        
        pending = vendor.earnings.filter(status='pending').aggregate(
            pending_amount=Sum('net_amount')
        )
        
        paid = vendor.earnings.filter(status='paid').aggregate(
            paid_amount=Sum('net_amount')
        )
        
        return Response({
            "total_earnings": totals['total_net'] or 0,
            "platform_fees": totals['total_fees'] or 0,
            "available_balance": pending['pending_amount'] or 0,
            "paid_out": paid['paid_amount'] or 0,
            "earnings_count": vendor.earnings.count()
        })


class PayoutsViewSet(viewsets.ReadOnlyModelViewSet):
    """List and request vendor payouts"""
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if not hasattr(self.request.user, 'vendor_profile'):
            return Payout.objects.none()
        return self.request.user.vendor_profile.payouts.order_by('-created_at')
    
    @action(detail=False, methods=['post'], url_path='request')
    def request_payout(self, request):
        """Request a new payout"""
        if not hasattr(request.user, 'vendor_profile'):
            return Response({"error": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        vendor = request.user.vendor_profile
        
        # Validate bank details exist
        if not hasattr(vendor, 'bank_details'):
            return Response(
                {"error": "Please add bank details before requesting payout"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PayoutRequestSerializer(data=request.data, context={'vendor': vendor})
        if serializer.is_valid():
            # Create payout request
            payout = Payout.objects.create(
                vendor=vendor,
                amount=serializer.validated_data['amount']
            )
            
            # Mark corresponding earnings as paid (simple FIFO approach)
            remaining = payout.amount
            for earning in vendor.earnings.filter(status='pending').order_by('created_at'):
                if remaining <= 0:
                    break
                earning.status = 'paid'
                earning.save()
                remaining -= earning.net_amount
            
            return Response({
                "message": "Payout requested successfully",
                "payout_id": payout.id,
                "amount": str(payout.amount),
                "status": payout.status
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class KYCInitiateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not hasattr(request.user, 'vendor_profile'):
            return Response({"error": "User is not a vendor"}, status=status.HTTP_400_BAD_REQUEST)
        
        client = DigiLockerClient()
        txn_id = client.initiate_verification(request.user.id)
        
        return Response({
            "message": "KYC Verification Initiated",
            "transaction_id": txn_id,
            "redirect_url": "https://mock-digilocker.gov.in/verify?txn=" + txn_id
        })


class KYCCheckStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        txn_id = request.data.get('transaction_id')
        client = DigiLockerClient()
        result = client.check_status(txn_id)
        
        if result['status'] == 'verified':
            vendor = request.user.vendor_profile
            vendor.is_verified = True
            vendor.save()
            
        return Response(result)

