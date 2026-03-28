from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth & Users
    path('api/users/', include('users.urls')),
    
    # Jobs Marketplace
    path('api/jobs/', include('jobs.urls')),
    
    # Profiles & Documents (We will create this app next)
    path('api/profiles/', include('profiles.urls')),
]

# This part is crucial! It tells Django to serve media files from the MEDIA_ROOT folder
# when you are running in development mode (DEBUG=True).
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)