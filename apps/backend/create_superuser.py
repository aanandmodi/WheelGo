import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User

if not User.objects.filter(phone_number='9999999999').exists():
    User.objects.create_superuser(phone_number='9999999999', password='admin')
    print('Superuser created: 9999999999 / admin')
else:
    print('Superuser already exists')
