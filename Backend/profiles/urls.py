from django.urls import path
from .views import DocumentUploadView

urlpatterns = [
    # GET: List my docs, POST: Upload new doc
    path('documents/', DocumentUploadView.as_view(), name='doc-upload'),
]