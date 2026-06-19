from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class Job(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('scheduled', 'Scheduled'),
        ('worker_completed', 'Worker Completed'),
        ('disputed', 'Disputed'),
        ('completed', 'Completed'),
        ('declined', 'Declined'),
    )

    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posted_jobs')
    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='taken_jobs')
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    service_type = models.CharField(max_length=50) # Maid, Cook, Arranger
    
    # Location data for matching
    latitude = models.FloatField()
    longitude = models.FloatField()
    address = models.CharField(max_length=255)
    
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    is_negotiable = models.BooleanField(default=False)
    
    URGENCY_CHOICES = (
        ('Standard', 'Standard'),
        ('Emergency', 'Emergency'),
    )
    urgency_level = models.CharField(max_length=20, choices=URGENCY_CHOICES, default='Standard')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    # Direct Request & Scheduling Fields (added by migration 0009)
    is_direct_request = models.BooleanField(default=False)
    scheduled_date = models.DateField(blank=True, null=True)
    scheduled_time_slot = models.CharField(max_length=50, blank=True, null=True)

    # Counter-offer Fields
    counter_budget = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    counter_date = models.DateField(blank=True, null=True)
    counter_time_slot = models.CharField(max_length=50, blank=True, null=True)
    counter_proposed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='counter_proposed_jobs')

    # Escrow and Payment Fields
    ESCROW_STATUS_CHOICES = (
        ('none', 'None'),
        ('pending', 'Pending Payment'),
        ('held', 'Funds Held'),
        ('released', 'Funds Released'),
        ('refunded', 'Refunded'),
    )
    escrow_status = models.CharField(max_length=20, choices=ESCROW_STATUS_CHOICES, default='none')
    payment_method = models.CharField(max_length=20, default='simulated')
    razorpay_order_id = models.CharField(max_length=255, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=255, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    released_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.status} (Escrow: {self.escrow_status})"


class Review(models.Model):
    REVIEW_TYPES = (
        ('client_to_worker', 'Client Reviewing Worker'),
        ('worker_to_client', 'Worker Reviewing Client'),
    )

    # Changed from OneToOne to ForeignKey so a job can have multiple reviews (one each way)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='reviews')
    
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews_given')
    # The 'target' is the person being reviewed
    target = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews_received')
    
    review_type = models.CharField(max_length=20, choices=REVIEW_TYPES)
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ensure a reviewer can only review a specific job once
        unique_together = ('job', 'reviewer')

    def __str__(self):
        return f"{self.rating} Stars by {self.reviewer.username} for {self.target.username}"