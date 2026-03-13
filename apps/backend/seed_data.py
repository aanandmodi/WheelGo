import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from inventory.models import Category

categories = [
    {'name': 'Electric', 'description': 'Eco-friendly electric bikes'},
    {'name': 'Sports', 'description': 'High performance sports bikes'},
    {'name': 'Cruiser', 'description': 'Comfortable cruiser bikes for long rides'},
    {'name': 'Scooter', 'description': 'Easy to ride scooters for city commute'},
]

for cat_data in categories:
    cat, created = Category.objects.get_or_create(name=cat_data['name'], defaults=cat_data)
    if created:
        print(f"Created category: {cat.name} (ID: {cat.id})")
    else:
        print(f"Category already exists: {cat.name} (ID: {cat.id})")
