from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import UserSerializer, MyTokenObtainPairSerializer

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

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

from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer

class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        user = request.user
        id_type = request.data.get('id_type')
        id_front_image = request.data.get('id_front_image')
        id_back_image = request.data.get('id_back_image')
        id_selfie_image = request.data.get('id_selfie_image')

        if not id_type or not id_front_image or not id_back_image:
            return Response({"error": "ID Type, Front Image, and Back Image are required."}, status=status.HTTP_400_BAD_REQUEST)

        user.id_type = id_type
        user.id_front_image = id_front_image
        user.id_back_image = id_back_image
        if id_selfie_image:
            user.id_selfie_image = id_selfie_image
        
        user.verification_status = 'pending'
        user.save()

        return Response({"message": "Documents uploaded successfully. Verification is pending.", "status": "pending"}, status=status.HTTP_200_OK)

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({"message": "Notification marked as read."}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)