from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Category, Bike
from .serializers import CategorySerializer, BikeSerializer, BikeCreateSerializer
from common.utils import haversine


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


from rest_framework.pagination import PageNumberPagination

class BikePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class BikeViewSet(viewsets.ModelViewSet):
    queryset = Bike.objects.all()
    serializer_class = BikeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = (MultiPartParser, FormParser)
    pagination_class = BikePagination
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return BikeCreateSerializer
        return BikeSerializer
    
    def get_serializer_context(self):
        """Pass request to serializer for is_favorited check"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        queryset = Bike.objects.select_related('vendor', 'category').all()
        
        # Vendor sees only their own bikes
        if self.request.user.is_authenticated and hasattr(self.request.user, 'role') and self.request.user.role == 'vendor':
             if hasattr(self.request.user, 'vendor_profile'):
                 queryset = queryset.filter(vendor=self.request.user.vendor_profile)

        # Filter by Category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__id=category)
        
        # Filter by Category Name
        category_name = self.request.query_params.get('category_name')
        if category_name:
            queryset = queryset.filter(category__name__iexact=category_name)
        
        # Filter by Status (for customer: only show available)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        else:
            # Default: show only available bikes for non-vendor users
            if not (self.request.user.is_authenticated and hasattr(self.request.user, 'vendor_profile')):
                queryset = queryset.filter(status='available')
        
        # Filter by Price Range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price_per_hour__gte=float(min_price))
        if max_price:
            queryset = queryset.filter(price_per_hour__lte=float(max_price))
        
        # Filter by Minimum Rating
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.filter(average_rating__gte=float(min_rating))
            
        # Filter by Location
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = self.request.query_params.get('radius', 10)  # km
        
        if lat and lng:
            lat = float(lat)
            lng = float(lng)
            filtered_ids = []
            for bike in queryset:
                if bike.vendor.latitude and bike.vendor.longitude:
                    dist = haversine(lat, lng, bike.vendor.latitude, bike.vendor.longitude)
                    if dist <= float(radius):
                        filtered_ids.append(bike.id)
            queryset = queryset.filter(id__in=filtered_ids)
        
        # Search by brand/model
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(brand__icontains=search) | Q(model__icontains=search)
            )
        
        # Sorting
        sort_by = self.request.query_params.get('sort_by')
        if sort_by == 'price_low':
            queryset = queryset.order_by('price_per_hour')
        elif sort_by == 'price_high':
            queryset = queryset.order_by('-price_per_hour')
        elif sort_by == 'rating':
            queryset = queryset.order_by('-average_rating')
        elif sort_by == 'newest':
            queryset = queryset.order_by('-created_at')
        else:
            queryset = queryset.order_by('-created_at')  # Default
            
        return queryset

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'vendor_profile'):
            serializer.save(vendor=self.request.user.vendor_profile)
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only vendors can add bikes. Create a vendor profile first.")

    @action(detail=True, methods=['post'], url_path='toggle-availability')
    def toggle_availability(self, request, pk=None):
        """Toggle bike between available and maintenance status."""
        bike = self.get_object()
        
        # Verify ownership
        if not hasattr(request.user, 'vendor_profile') or bike.vendor != request.user.vendor_profile:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if bike is currently in use
        if bike.status in ['reserved', 'active']:
            return Response(
                {"error": f"Cannot toggle availability while bike is {bike.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Toggle between available and maintenance
        if bike.status == 'available':
            bike.status = 'maintenance'
            message = "Bike marked as under maintenance"
        else:
            bike.status = 'available'
            message = "Bike is now available for booking"
        
        bike.save()
        
        return Response({
            "message": message,
            "bike_id": bike.id,
            "status": bike.status
        })
