from django.urls import path
from .views import RegisterView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # 1. Registration: http://127.0.0.1:8000/api/users/register/
    path('register/', RegisterView.as_view(), name='auth_register'),
    
    # 2. Login: http://127.0.0.1:8000/api/users/login/
    # This handles the password check and returns the JWT tokens
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # 3. Refresh Token: http://127.0.0.1:8000/api/users/token/refresh/
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]