from rest_framework import generics, permissions
from .models import WorkerDocument
from .serializers import WorkerDocumentSerializer

class DocumentUploadView(generics.ListCreateAPIView):
    """
    GET: List all documents uploaded by the logged-in worker.
    POST: Upload a new document.
    """
    serializer_class = WorkerDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return documents belonging to the current user
        return WorkerDocument.objects.filter(worker=self.request.user)

    def perform_create(self, serializer):
        # Automatically assign the logged-in user as the owner of the document
        serializer.save(worker=self.request.user)