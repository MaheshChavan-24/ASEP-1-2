from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    VERIFICATION_STATUS_CHOICES = (
        ('unsubmitted', 'Unsubmitted'),
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )

    is_client = models.BooleanField(default=False)
    is_worker = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address_lat = models.FloatField(blank=True, null=True)
    address_lng = models.FloatField(blank=True, null=True)

    # Document Verification Fields
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='unsubmitted')
    id_type = models.CharField(max_length=50, blank=True, null=True)
    id_front_image = models.ImageField(upload_to='id_documents/', blank=True, null=True)
    id_back_image = models.ImageField(upload_to='id_documents/', blank=True, null=True)
    id_selfie_image = models.ImageField(upload_to='id_documents/', blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(blank=True, null=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)

    # Wallet & Bank Transfer Payout Fields
    wallet_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    bank_account_number = models.CharField(max_length=30, blank=True, null=True)
    bank_ifsc = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.username

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username} - {self.title}"