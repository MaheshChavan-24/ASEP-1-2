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