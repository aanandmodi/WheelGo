from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, BikeViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'bikes', BikeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
