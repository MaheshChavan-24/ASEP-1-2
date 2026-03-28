from rest_framework import serializers
from .models import Job

class JobSerializer(serializers.ModelSerializer):
    client_username = serializers.ReadOnlyField(source='client.username')

    client_phone = serializers.ReadOnlyField(source='client.phone_number')

    worker_username = serializers.ReadOnlyField(source='worker.username')

    worker_phone = serializers.ReadOnlyField(source='worker.phone_number')
    
    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ('client', 'status', 'created_at', 'worker')

from .models import Job, Review


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_username = serializers.ReadOnlyField(source='reviewer.username')
    target_username = serializers.ReadOnlyField(source='target.username') # Changed from worker_username

    class Meta:
        model = Review
        # Changed 'worker' to 'target' to match the updated Model
        fields = ['id', 'job', 'reviewer', 'reviewer_username', 'target', 'target_username', 'rating', 'comment', 'created_at']
        read_only_fields = ['reviewer', 'target', 'created_at']