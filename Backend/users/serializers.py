from rest_framework import serializers
from .models import User, Notification

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    # Explicitly define fields to ensure they are required/handled
    first_name = serializers.CharField(required=True) # Used for "Name"
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'email', 'phone_number', 'password', 'is_client', 'is_worker', 'verification_status', 'rejection_reason', 'wallet_balance', 'bank_name', 'bank_account_number', 'bank_ifsc')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'], # Save Name
            phone_number=validated_data['phone_number'],
            is_client=validated_data.get('is_client', False),
            is_worker=validated_data.get('is_worker', False)
        )
        return user

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add extra responses here
        data['user'] = UserSerializer(self.user).data
        return data