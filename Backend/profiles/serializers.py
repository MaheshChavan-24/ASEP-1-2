from rest_framework import serializers
from .models import WorkerDocument, TradeProfile, ServiceRequest, WorkerProfile
from django.db.models import Avg, Count

class WorkerDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerDocument
        fields = ['id', 'document_type', 'file', 'status', 'uploaded_at']
        read_only_fields = ['status', 'uploaded_at'] 
        # 'status' is read-only because workers shouldn't be able to mark themselves as "verified"


class TradeProfileSerializer(serializers.ModelSerializer):
    worker_username = serializers.ReadOnlyField(source='worker.username')
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = TradeProfile
        fields = [
            'id', 'worker', 'worker_username', 'display_name', 'trade_category',
            'skills', 'experience_description', 'years_of_experience',
            'availability', 'tools_equipment', 'languages', 'is_active',
            'created_at', 'updated_at', 'average_rating', 'review_count'
        ]
        read_only_fields = ['worker', 'is_active', 'created_at', 'updated_at']

    def get_average_rating(self, obj):
        from jobs.models import Review
        result = Review.objects.filter(target=obj.worker, review_type='client_to_worker').aggregate(avg=Avg('rating'))
        return round(result['avg'], 1) if result['avg'] else 0

    def get_review_count(self, obj):
        from jobs.models import Review
        return Review.objects.filter(target=obj.worker, review_type='client_to_worker').count()


class ServiceRequestSerializer(serializers.ModelSerializer):
    client_username = serializers.ReadOnlyField(source='client.username')
    worker_username = serializers.ReadOnlyField(source='worker.username')
    trade_category = serializers.ReadOnlyField(source='trade_profile.trade_category')
    worker_display_name = serializers.ReadOnlyField(source='trade_profile.display_name')

    class Meta:
        model = ServiceRequest
        fields = [
            'id', 'client', 'client_username', 'worker', 'worker_username',
            'trade_profile', 'trade_category', 'worker_display_name',
            'description', 'preferred_date', 'preferred_time_slot',
            'status', 'worker_notes', 'created_at',
            'budget', 'escrow_status', 'payment_method', 'razorpay_order_id', 
            'razorpay_payment_id', 'razorpay_signature', 'paid_at', 'released_at'
        ]
        read_only_fields = [
            'client', 'worker', 'status', 'created_at', 'escrow_status', 
            'payment_method', 'razorpay_order_id', 'razorpay_payment_id', 
            'razorpay_signature', 'paid_at', 'released_at'
        ]

class WorkerProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    name = serializers.ReadOnlyField(source='user.get_full_name')

    class Meta:
        model = WorkerProfile
        fields = ['id', 'user', 'username', 'name', 'latitude', 'longitude', 'is_active', 'last_updated']
        read_only_fields = ['user', 'last_updated']