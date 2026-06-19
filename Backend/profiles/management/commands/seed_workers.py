import math
import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from profiles.models import WorkerProfile

User = get_user_model()

# Kondhwa Hub Coordinates
HUB_LAT = 18.4740
HUB_LON = 73.8925

def generate_random_point(center_lat, center_lon, radius_in_km):
    # Radius of the Earth in km
    radius_earth = 6371.0

    # Convert radius from km to radians
    radius_in_radians = radius_in_km / radius_earth

    # Random angle in radians
    w = radius_in_radians * math.sqrt(random.random())
    t = 2 * math.pi * random.random()

    # Calculate offset
    x = w * math.cos(t)
    y = w * math.sin(t)

    # Adjust for latitude (longitude scaling)
    new_lon = x / math.cos(math.radians(center_lat)) + math.radians(center_lon)
    new_lat = y + math.radians(center_lat)

    # Convert back to degrees
    return math.degrees(new_lat), math.degrees(new_lon)

class Command(BaseCommand):
    help = 'Seeds the database with 10 mock worker profiles for proximity testing.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting to seed workers...")

        # Delete existing seeded workers to start fresh
        User.objects.filter(username__startswith='mockworker_').delete()

        # Seed 5 nearby workers (1 to 4 km)
        for i in range(1, 6):
            distance = random.uniform(1.0, 4.0)
            lat, lon = generate_random_point(HUB_LAT, HUB_LON, distance)
            
            user = User.objects.create_user(
                username=f'mockworker_near_{i}',
                password='Password@123',
                first_name=f'NearbyWorker{i}',
                is_worker=True,
                verification_status='verified'
            )
            
            WorkerProfile.objects.create(
                user=user,
                latitude=lat,
                longitude=lon,
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS(f'Created nearby worker {i} at {distance:.2f} km'))

        # Seed 5 distant workers (7 to 12 km)
        for i in range(1, 6):
            distance = random.uniform(7.0, 12.0)
            lat, lon = generate_random_point(HUB_LAT, HUB_LON, distance)
            
            user = User.objects.create_user(
                username=f'mockworker_far_{i}',
                password='Password@123',
                first_name=f'FarWorker{i}',
                is_worker=True,
                verification_status='verified'
            )
            
            WorkerProfile.objects.create(
                user=user,
                latitude=lat,
                longitude=lon,
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS(f'Created distant worker {i} at {distance:.2f} km'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded 10 mock workers.'))
