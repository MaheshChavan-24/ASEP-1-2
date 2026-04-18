from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer

class RegisterView(generics.CreateAPIView):
    """
    Handles POST requests to create a new user.
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,) # Anyone can register
    serializer_class = UserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "user": UserSerializer(user).data,
                "message": "Account created successfully!",
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GoogleLoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        uid = request.data.get('uid')
        name = request.data.get('displayName', '')
        role = request.data.get('role')

        if not email or not uid:
            return Response({"error": "Email and UID are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user exists
        user = User.objects.filter(email=email).first()
        
        if not user:
            # Inform frontend that user doesn't exist and needs to complete registration
            return Response({
                "needs_registration": True,
                "email": email,
                "name": name,
                "uid": uid
            }, status=status.HTTP_200_OK)

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)