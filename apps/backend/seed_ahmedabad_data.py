import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from vendors.models import Vendor
from inventory.models import Category, Bike
from decimal import Decimal

User = get_user_model()

print("Seeding Ahmedabad Vendor and Bike data...")

# Ensure Categories exist
categories_data = [
    {'name': 'Electric', 'description': 'Eco-friendly electric bikes'},
    {'name': 'Sports', 'description': 'High performance sports bikes'},
    {'name': 'Cruiser', 'description': 'Comfortable cruiser bikes for long rides'},
    {'name': 'Scooter', 'description': 'Easy to ride scooters for city commute'},
]

categories = {}
for cat_data in categories_data:
    cat, _ = Category.objects.get_or_create(name=cat_data['name'], defaults=cat_data)
    categories[cat.name] = cat

# Vendor definitions (all in Ahmedabad)
# Coordinates picked to be within 2-10km of Ahmedabad Center (23.0225, 72.5714)
vendors_info = [
    {
        'phone': '9499604904',
        'shop_name': 'WheelGo Rentals (Gota)',
        'address': '3GQM+QJR, Gota, Ahmedabad, Gujarat 382481',
        'latitude': 23.089576,
        'longitude': 72.534074,
        'area_name': 'Gota',
        'city': 'Ahmedabad',
        'full_address': 'Gota, Ahmedabad, Gujarat 382481, India',
        'is_verified': True
    },
    {
        'phone': '8888888888',
        'shop_name': 'Ambica Two Wheelers (Navrangpura)',
        'address': 'Navrangpura Char Rasta, Ahmedabad, Gujarat 380009',
        'latitude': 23.022500,
        'longitude': 72.571400,
        'area_name': 'Navrangpura',
        'city': 'Ahmedabad',
        'full_address': 'Navrangpura, Ahmedabad, Gujarat 380009, India',
        'is_verified': True
    },
    {
        'phone': '9998887772',
        'shop_name': 'Shayona Auto (Ranip)',
        'address': 'Ranip Cross Roads, Ahmedabad, Gujarat 382480',
        'latitude': 23.061200,
        'longitude': 72.560100,
        'area_name': 'Ranip',
        'city': 'Ahmedabad',
        'full_address': 'Ranip, Ahmedabad, Gujarat 382480, India',
        'is_verified': True
    },
    {
        'phone': '9499604905',
        'shop_name': 'Prahlad Nagar Rentals',
        'address': 'Prahlad Nagar Corporate Road, Ahmedabad, Gujarat 380515',
        'latitude': 23.012000,
        'longitude': 72.520000,
        'area_name': 'Prahlad Nagar',
        'city': 'Ahmedabad',
        'full_address': 'Prahlad Nagar, Ahmedabad, Gujarat 380515, India',
        'is_verified': True
    }
]

# Delete existing bikes to start clean
Bike.objects.all().delete()

vendors = []
for v_info in vendors_info:
    # Get or create user
    user, created = User.objects.get_or_create(phone_number=v_info['phone'])
    user.role = 'vendor'
    user.save()
    
    # Get or create vendor profile
    vendor, created = Vendor.objects.get_or_create(
        user=user,
        defaults={
            'shop_name': v_info['shop_name'],
            'address': v_info['address'],
            'latitude': v_info['latitude'],
            'longitude': v_info['longitude'],
            'area_name': v_info['area_name'],
            'city': v_info['city'],
            'full_address': v_info['full_address'],
            'is_verified': v_info['is_verified']
        }
    )
    if not created:
        # Update existing
        vendor.shop_name = v_info['shop_name']
        vendor.address = v_info['address']
        vendor.latitude = v_info['latitude']
        vendor.longitude = v_info['longitude']
        vendor.area_name = v_info['area_name']
        vendor.city = v_info['city']
        vendor.full_address = v_info['full_address']
        vendor.is_verified = v_info['is_verified']
        vendor.save()
    
    vendors.append(vendor)
    print(f"Vendor profile updated: {vendor.shop_name} ({vendor.city})")

# Bike definitions to populate
bikes_data = [
    {
        'vendor': vendors[0],
        'category': categories['Cruiser'],
        'brand': 'Royal Enfield',
        'model': 'Classic 350',
        'number_plate': 'GJ01AB1234',
        'description': 'Pure retro cruiser, comfortable ride for long distances.',
        'price_per_hour': Decimal('120.00'),
        'condition': 'Excellent',
        'status': 'available',
        'average_rating': Decimal('4.8'),
        'review_count': 12
    },
    {
        'vendor': vendors[0],
        'category': categories['Scooter'],
        'brand': 'Honda',
        'model': 'Activa 6G',
        'number_plate': 'GJ01CD5678',
        'description': 'Most reliable city scooter, great mileage.',
        'price_per_hour': Decimal('50.00'),
        'condition': 'Very Good',
        'status': 'available',
        'average_rating': Decimal('4.5'),
        'review_count': 8
    },
    {
        'vendor': vendors[1],
        'category': categories['Electric'],
        'brand': 'Ola',
        'model': 'S1 Pro',
        'number_plate': 'GJ01EF9012',
        'description': 'High performance electric scooter with sports mode.',
        'price_per_hour': Decimal('80.00'),
        'condition': 'Excellent',
        'status': 'available',
        'average_rating': Decimal('4.2'),
        'review_count': 5
    },
    {
        'vendor': vendors[2],
        'category': categories['Electric'],
        'brand': 'Ather',
        'model': '450X',
        'number_plate': 'GJ01GH3456',
        'description': 'Eco-friendly electric ride, super quick acceleration.',
        'price_per_hour': Decimal('90.00'),
        'condition': 'Like New',
        'status': 'available',
        'average_rating': Decimal('4.7'),
        'review_count': 9
    },
    {
        'vendor': vendors[3],
        'category': categories['Sports'],
        'brand': 'KTM',
        'model': 'Duke 390',
        'number_plate': 'GJ01IJ7890',
        'description': 'A lightweight sport motorcycle with high power.',
        'price_per_hour': Decimal('200.00'),
        'condition': 'Excellent',
        'status': 'available',
        'average_rating': Decimal('4.9'),
        'review_count': 15
    },
    {
        'vendor': vendors[3],
        'category': categories['Scooter'],
        'brand': 'Suzuki',
        'model': 'Access 125',
        'number_plate': 'GJ01KL2345',
        'description': 'Stylish city scooter, fuel-efficient and smooth.',
        'price_per_hour': Decimal('65.00'),
        'condition': 'Good',
        'status': 'available',
        'average_rating': Decimal('4.4'),
        'review_count': 6
    }
]

for b_data in bikes_data:
    bike = Bike.objects.create(**b_data)
    print(f"Created Bike: {bike.brand} {bike.model} at {bike.vendor.shop_name}")

print("Seeding Complete!")
