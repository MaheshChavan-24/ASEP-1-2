from rest_framework import serializers
from .models import WorkerDocument

class WorkerDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerDocument
        fields = ['id', 'document_type', 'file', 'status', 'uploaded_at']
        read_only_fields = ['status', 'uploaded_at'] 
        # 'status' is read-only because workers shouldn't be able to mark themselves as "verified"