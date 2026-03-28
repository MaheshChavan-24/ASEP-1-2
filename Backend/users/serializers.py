from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    # Explicitly define fields to ensure they are required/handled
    first_name = serializers.CharField(required=True) # Used for "Name"
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'email', 'phone_number', 'password', 'is_client', 'is_worker')

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