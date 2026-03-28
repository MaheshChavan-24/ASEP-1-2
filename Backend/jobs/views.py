from rest_framework import generics, permissions, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Job, Review
from .serializers import JobSerializer, ReviewSerializer
from math import cos, asin, sqrt, pi


class JobCreateView(generics.CreateAPIView):
    """Clients use this to post a job"""
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

class JobListView(generics.ListAPIView):
    """Workers use this to see available jobs"""
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # We only show jobs that are still 'pending'
        return Job.objects.filter(status='pending')

class AcceptJobView(APIView):
    """Workers use this to claim a job"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            # Look for a job that is still pending
            job = Job.objects.get(pk=pk, status='pending')
            
            # Prevent clients from accepting their own jobs (optional safety check)
            if job.client == request.user:
                return Response({"error": "You cannot accept your own job."}, status=status.HTTP_400_BAD_REQUEST)

            # Assign the worker and update status
            job.worker = request.user
            job.status = 'accepted'
            job.save()
            
            return Response({"message": "Job accepted successfully!"}, status=status.HTTP_200_OK)
        except Job.DoesNotExist:
            return Response({"error": "Job not found or already taken."}, status=status.HTTP_404_NOT_FOUND)
        
class CreateReviewView(generics.CreateAPIView):
    """
    POST: Create a review for a completed job.
    Supports both:
    - Client reviewing Worker
    - Worker reviewing Client
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        job_id = self.request.data.get('job')
        
        # 1. Validate Job Exists
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            raise serializers.ValidationError({"error": "Job not found."})

        user = self.request.user
        
        # 2. Logic to Determine Review Type
        # Debugging Tip: Print these IDs in your terminal if it still fails!
        # print(f"User ID: {user.id}, Client ID: {job.client.id}, Worker ID: {job.worker.id}")

        if user.id == job.client.id:
            target_user = job.worker
            review_type = 'client_to_worker'
        elif job.worker and user.id == job.worker.id:
            target_user = job.client
            review_type = 'worker_to_client'
        else:
            raise serializers.ValidationError({"error": "You are not authorized to review this job."})
            
        if not target_user:
             raise serializers.ValidationError({"error": "Cannot review yet. Job is not fully assigned."})

        # 3. Check for existing review
        if Review.objects.filter(job=job, reviewer=user).exists():
            raise serializers.ValidationError({"error": "You have already reviewed this job."})

        # 4. Save the Review
        serializer.save(
            job=job,
            reviewer=user,
            target=target_user,
            review_type=review_type
        )

class WorkerReviewsView(generics.ListAPIView):
    """
    GET: List all reviews for a specific worker ID.
    URL: /api/jobs/reviews/worker/<worker_id>/
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        worker_id = self.kwargs['worker_id']
        # FIX: Filter by 'target_id' because we renamed 'worker' to 'target' in the model
        return Review.objects.filter(target_id=worker_id).order_by('-created_at')
    
class ClientJobListView(generics.ListAPIView):
    """
    GET: List all jobs posted by the logged-in client.
    """
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return only jobs created by the current user
        return Job.objects.filter(client=self.request.user).order_by('-created_at')
    
class CompleteJobView(APIView):
    """
    PATCH: Mark a job as completed.
    Only the client who created the job can do this.
    URL: /api/jobs/<pk>/complete/
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
            
            # Security Check: Only the client can complete it
            if job.client != request.user:
                return Response({"error": "You are not authorized to complete this job."}, status=status.HTTP_403_FORBIDDEN)
            
            # Logic Check: Only accepted jobs can be completed
            # (Prevents completing a job that hasn't even been accepted yet)
            if job.status != 'accepted':
                return Response({"error": "Job must be accepted before it can be completed."}, status=status.HTTP_400_BAD_REQUEST)

            job.status = 'completed'
            job.save()
            
            return Response({"message": "Job marked as completed!"}, status=status.HTTP_200_OK)
            
        except Job.DoesNotExist:
            return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)
        

class ActiveJobView(generics.RetrieveAPIView):
    """
    GET: Returns the ONE job currently accepted by the worker.
    URL: /api/jobs/active/
    """
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Find the first job where this user is the worker and status is 'accepted'
        try:
            return Job.objects.filter(worker=self.request.user, status='accepted').latest('created_at')
        except Job.DoesNotExist:
            return None 

    def get(self, request, *args, **kwargs):
        job = self.get_object()
        if job is None:
            return Response({"message": "No active job found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(job)
        return Response(serializer.data)
    

class WorkerJobHistoryView(generics.ListAPIView):
    """
    GET: List all jobs worked on by the logged-in user.
    """
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return jobs where the user is the worker
        # Order by newest first
        return Job.objects.filter(worker=self.request.user).order_by('-created_at')
    

class MyReviewsView(generics.ListAPIView):
    """
    GET: List reviews received by the logged-in user.
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(target=self.request.user).order_by('-created_at')