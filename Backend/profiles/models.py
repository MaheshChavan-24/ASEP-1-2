from django.db import models
from django.conf import settings

class WorkerDocument(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )

    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50) # e.g. "ID Proof", "Certificate"
    file = models.FileField(upload_to='worker_docs/') # You need to configure media settings for this
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.worker.username} - {self.document_type} ({self.status})"


TRADE_CATEGORY_CHOICES = (
    ('Plumbing', 'Plumbing'),
    ('Carpentry', 'Carpentry'),
    ('Electrical Work', 'Electrical Work'),
    ('Painting', 'Painting'),
    ('Cleaning / Deep Clean', 'Cleaning / Deep Clean'),
    ('Appliance Repair', 'Appliance Repair'),
    ('Gardening / Landscaping', 'Gardening / Landscaping'),
    ('Pest Control', 'Pest Control'),
    ('Masonry / Tiling', 'Masonry / Tiling'),
    ('AC & HVAC Servicing', 'AC & HVAC Servicing'),
    ('Moving & Heavy Lifting', 'Moving & Heavy Lifting'),
    ('Welding / Fabrication', 'Welding / Fabrication'),
    ('Interior Design Consultation', 'Interior Design Consultation'),
    ('Security & CCTV Installation', 'Security & CCTV Installation'),
    ('Computer / IT Repair', 'Computer / IT Repair'),
)


class TradeProfile(models.Model):
    """
    A worker's public-facing profile within a specific trade category.
    Workers can create one profile per trade category.
    """
    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='trade_profiles')
    display_name = models.CharField(max_length=100)
    trade_category = models.CharField(max_length=50, choices=TRADE_CATEGORY_CHOICES)
    skills = models.TextField(help_text="List of skills and specializations")
    experience_description = models.TextField(help_text="Past work experience described in text")
    years_of_experience = models.PositiveIntegerField(default=0)
    availability = models.TextField(help_text="Days/hours generally available, e.g. Mon-Fri 9AM-5PM")
    tools_equipment = models.TextField(blank=True, default='', help_text="Tools or equipment they own")
    languages = models.CharField(max_length=200, blank=True, default='', help_text="Languages spoken")
    is_active = models.BooleanField(default=False, help_text="Profile goes live only after required fields are filled")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('worker', 'trade_category')

    def __str__(self):
        return f"{self.display_name} — {self.trade_category}"


class ServiceRequest(models.Model):
    """
    A request from a client to a specific worker (via their trade profile).
    Includes scheduling with date and time slot.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    )

    TIME_SLOT_CHOICES = (
        ('09:00 AM - 10:00 AM', '09:00 AM - 10:00 AM'),
        ('10:00 AM - 11:00 AM', '10:00 AM - 11:00 AM'),
        ('11:00 AM - 12:00 PM', '11:00 AM - 12:00 PM'),
        ('12:00 PM - 01:00 PM', '12:00 PM - 01:00 PM'),
        ('01:00 PM - 02:00 PM', '01:00 PM - 02:00 PM'),
        ('02:00 PM - 03:00 PM', '02:00 PM - 03:00 PM'),
        ('03:00 PM - 04:00 PM', '03:00 PM - 04:00 PM'),
        ('04:00 PM - 05:00 PM', '04:00 PM - 05:00 PM'),
        ('05:00 PM - 06:00 PM', '05:00 PM - 06:00 PM'),
    )

    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_service_requests')
    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_service_requests')
    trade_profile = models.ForeignKey(TradeProfile, on_delete=models.CASCADE, related_name='service_requests')
    description = models.TextField(help_text="Description of work needed")
    preferred_date = models.DateField()
    preferred_time_slot = models.CharField(max_length=30, choices=TIME_SLOT_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    worker_notes = models.TextField(blank=True, default='', help_text="Counter-proposal or notes from worker")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request from {self.client.username} to {self.worker.username} — {self.status}"

class WorkerProfile(models.Model):
    """
    Model specifically for storing real-time geolocation of a worker
    to be used with the Geospatial Proximity System.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='location_profile')
    latitude = models.FloatField(blank=True, null=True, help_text="Worker's real-time latitude")
    longitude = models.FloatField(blank=True, null=True, help_text="Worker's real-time longitude")
    is_active = models.BooleanField(default=True, help_text="Is the worker currently accepting requests?")
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Location Profile for {self.user.username} (Active: {self.is_active})"