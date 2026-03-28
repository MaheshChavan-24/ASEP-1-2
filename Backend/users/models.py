from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    is_client = models.BooleanField(default=False)
    is_worker = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address_lat = models.FloatField(blank=True, null=True)
    address_lng = models.FloatField(blank=True, null=True)

    def __str__(self):
        return self.username