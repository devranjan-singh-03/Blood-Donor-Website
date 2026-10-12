from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os


class Command(BaseCommand):
    help = 'Create superuser from environment variables (for Render free plan)'

    def handle(self, *args, **options):
        User = get_user_model()
        
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@bhumi.com')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
        
        if not password:
            self.stdout.write(self.style.WARNING(
                '⚠️ DJANGO_SUPERUSER_PASSWORD not set. Skipping superuser creation.'
            ))
            return
        
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(
                f'⚠️ Superuser "{username}" already exists.'
            ))
            return
        
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        
        self.stdout.write(self.style.SUCCESS(
            f'✅ Superuser "{username}" created successfully!'
        ))