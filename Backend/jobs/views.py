from rest_framework import generics, permissions, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from users.models import Notification
from .models import Job, Review
from .serializers import JobSerializer, ReviewSerializer
from math import cos, asin, sqrt, pi


class JobCreateView(generics.CreateAPIView):
    """Clients use this to post a job"""
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.verification_status != 'verified':
            raise serializers.ValidationError({"error": "You must be verified to post a job."})
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
        if request.user.verification_status != 'verified':
            return Response({"error": "You must be verified to accept jobs."}, status=status.HTTP_403_FORBIDDEN)

        try:
            # Look for a job that is still pending
            job = Job.objects.get(pk=pk, status='pending')
            
            # Prevent clients from accepting their own jobs (optional safety check)
            if job.client == request.user:
                return Response({"error": "You cannot accept your own job."}, status=status.HTTP_400_BAD_REQUEST)

            # Assign the worker, set escrow to pending, and update status
            job.worker = request.user
            job.status = 'accepted'
            job.escrow_status = 'pending'
            job.save()

            # Create notification for client to fund the escrow
            Notification.objects.create(
                user=job.client,
                title="Worker Matched - Payment Required",
                message=f"Worker '{request.user.username}' accepted '{job.title}'. Please pay ₹{job.budget} to secure escrow and start work."
            )
            # Create notification for worker confirming they accepted
            Notification.objects.create(
                user=request.user,
                title="Job Claimed Successfully",
                message=f"You accepted '{job.title}'. Please wait for the client to fund the escrow before starting work."
            )
            
            return Response({"message": "Job accepted successfully! Escrow payment is pending from the client."}, status=status.HTTP_200_OK)
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
    
class WorkerCompleteJobView(APIView):
    """
    PATCH: Worker marks job as completed, waiting for client approval.
    URL: /api/jobs/<pk>/worker-complete/
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
            
            if job.worker != request.user:
                return Response({"error": "You are not authorized to mark this job as completed."}, status=status.HTTP_403_FORBIDDEN)
            
            if job.status != 'accepted':
                return Response({"error": "Job must be in accepted state to mark it as complete."}, status=status.HTTP_400_BAD_REQUEST)
                
            job.status = 'worker_completed'
            job.save()

            Notification.objects.create(
                user=job.client,
                title="Work Marked Completed",
                message=f"Worker '{request.user.username}' has marked '{job.title}' as completed. Please review and release the escrow."
            )
            
            return Response({"message": "Job marked as completed. Awaiting client approval."}, status=status.HTTP_200_OK)
        except Job.DoesNotExist:
            return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)


class DisputeJobView(APIView):
    """
    PATCH: Client marks job as disputed after worker claims completion.
    URL: /api/jobs/<pk>/dispute/
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
            
            if job.client != request.user:
                return Response({"error": "You are not authorized to dispute this job."}, status=status.HTTP_403_FORBIDDEN)
            
            if job.status != 'worker_completed':
                return Response({"error": "Job must be marked as completed by the worker to open a dispute."}, status=status.HTTP_400_BAD_REQUEST)
                
            job.status = 'disputed'
            job.save()

            if job.worker:
                Notification.objects.create(
                    user=job.worker,
                    title="Job Disputed",
                    message=f"Client '{request.user.username}' has disputed your completion of '{job.title}'. Support will contact you shortly."
                )
            
            return Response({"message": "Job marked as disputed. Our support team will review the escrow."}, status=status.HTTP_200_OK)
        except Job.DoesNotExist:
            return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)


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
            
            # Logic Check: Only accepted or worker_completed jobs can be completed
            if job.status not in ['accepted', 'worker_completed']:
                return Response({"error": "Job must be accepted or marked as completed by the worker before it can be completed."}, status=status.HTTP_400_BAD_REQUEST)

            # Escrow Validation Check: Escrow must be funded (held) before completion
            if job.escrow_status != 'held':
                return Response({"error": "Escrow payment must be secured (held) before marking this job as completed. Please fund the escrow first."}, status=status.HTTP_400_BAD_REQUEST)

            job.status = 'completed'
            job.escrow_status = 'released'
            job.released_at = timezone.now()
            job.save()

            # Release payout to the worker's wallet
            worker = job.worker
            worker.wallet_balance += job.budget
            worker.save()

            # Create notification for worker that funds are released
            Notification.objects.create(
                user=worker,
                title="Escrow Released - Paid!",
                message=f"Client '{request.user.username}' marked '{job.title}' as completed. ₹{job.budget} has been added to your wallet balance."
            )
            # Create notification for client confirming release
            Notification.objects.create(
                user=job.client,
                title="Job Completed & Payment Released",
                message=f"You marked '{job.title}' as completed. Escrow funds of ₹{job.budget} have been successfully transferred to '{worker.username}'."
            )
            
            return Response({"message": "Job marked as completed! Escrow funds have been successfully released to the worker.", "escrow_status": "released"}, status=status.HTTP_200_OK)
            
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
            return Job.objects.filter(worker=self.request.user, status__in=['accepted', 'worker_completed', 'disputed']).latest('created_at')
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