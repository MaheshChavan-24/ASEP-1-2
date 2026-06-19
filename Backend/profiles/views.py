from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import WorkerDocument, TradeProfile, ServiceRequest, WorkerProfile
from .serializers import WorkerDocumentSerializer, TradeProfileSerializer, ServiceRequestSerializer, WorkerProfileSerializer
from users.models import Notification
import math

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


# ============================================================
# TRADE PROFILE VIEWS
# ============================================================

class MyTradeProfilesView(generics.ListAPIView):
    """
    GET: List all trade profiles for the logged-in worker.
    """
    serializer_class = TradeProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TradeProfile.objects.filter(worker=self.request.user).order_by('-updated_at')


class TradeProfileCreateView(APIView):
    """
    POST: Create a new trade profile for the logged-in worker.
    Validates required fields and auto-activates if all filled.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.is_worker:
            return Response({"error": "Only workers can create trade profiles."}, status=status.HTTP_403_FORBIDDEN)

        if request.user.verification_status != 'verified':
            return Response({"error": "You must be verified to create a trade profile."}, status=status.HTTP_403_FORBIDDEN)

        category = request.data.get('trade_category')
        if TradeProfile.objects.filter(worker=request.user, trade_category=category).exists():
            return Response({"error": "You already have a profile in this trade category."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TradeProfileSerializer(data=request.data)
        if serializer.is_valid():
            # Auto-activate if all required fields are present
            is_active = all([
                request.data.get('display_name'),
                request.data.get('trade_category'),
                request.data.get('skills'),
                request.data.get('experience_description'),
                request.data.get('availability'),
                request.data.get('years_of_experience') is not None,
            ])
            serializer.save(worker=request.user, is_active=is_active)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TradeProfileUpdateView(APIView):
    """
    PUT: Update an existing trade profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        try:
            profile = TradeProfile.objects.get(pk=pk, worker=request.user)
        except TradeProfile.DoesNotExist:
            return Response({"error": "Trade profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TradeProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            # Re-validate activation
            updated = serializer.validated_data
            profile_data = {
                'display_name': updated.get('display_name', profile.display_name),
                'trade_category': updated.get('trade_category', profile.trade_category),
                'skills': updated.get('skills', profile.skills),
                'experience_description': updated.get('experience_description', profile.experience_description),
                'availability': updated.get('availability', profile.availability),
                'years_of_experience': updated.get('years_of_experience', profile.years_of_experience),
            }
            is_active = all([
                profile_data['display_name'],
                profile_data['trade_category'],
                profile_data['skills'],
                profile_data['experience_description'],
                profile_data['availability'],
                profile_data['years_of_experience'] is not None,
            ])
            serializer.save(is_active=is_active)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            profile = TradeProfile.objects.get(pk=pk, worker=request.user)
        except TradeProfile.DoesNotExist:
            return Response({"error": "Trade profile not found."}, status=status.HTTP_404_NOT_FOUND)
        profile.delete()
        return Response({"message": "Trade profile deleted."}, status=status.HTTP_200_OK)


class TradeProfileListByCategoryView(generics.ListAPIView):
    """
    GET: List all active trade profiles in a given category.
    URL: /api/profiles/trade-profiles/category/<category>/
    Public to authenticated users.
    """
    serializer_class = TradeProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        category = self.kwargs['category']
        return TradeProfile.objects.filter(trade_category=category, is_active=True).order_by('-updated_at')


class TradeProfileDetailView(generics.RetrieveAPIView):
    """
    GET: Retrieve a single trade profile by ID.
    """
    serializer_class = TradeProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = TradeProfile.objects.filter(is_active=True)


# ============================================================
# SERVICE REQUEST VIEWS
# ============================================================

class ServiceRequestCreateView(APIView):
    """
    POST: Create a service request from client to worker.
    Includes double-booking prevention.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.is_client:
            return Response({"error": "Only clients can send service requests."}, status=status.HTTP_403_FORBIDDEN)

        trade_profile_id = request.data.get('trade_profile')
        preferred_date = request.data.get('preferred_date')
        preferred_time_slot = request.data.get('preferred_time_slot')

        try:
            trade_profile = TradeProfile.objects.get(pk=trade_profile_id, is_active=True)
        except TradeProfile.DoesNotExist:
            return Response({"error": "Trade profile not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

        # Prevent requesting yourself
        if trade_profile.worker == request.user:
            return Response({"error": "You cannot request service from yourself."}, status=status.HTTP_400_BAD_REQUEST)

        # Double-booking check: prevent same worker, same date, same time slot with accepted/scheduled status
        existing = ServiceRequest.objects.filter(
            worker=trade_profile.worker,
            preferred_date=preferred_date,
            preferred_time_slot=preferred_time_slot,
            status__in=['accepted', 'scheduled', 'pending']
        ).exists()
        if existing:
            return Response(
                {"error": "This worker already has a booking for that date and time slot. Please choose a different time."},
                status=status.HTTP_409_CONFLICT
            )

        serializer = ServiceRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                client=request.user,
                worker=trade_profile.worker,
            )
            # Notify the worker
            Notification.objects.create(
                user=trade_profile.worker,
                title="New Service Request",
                message=f"Client '{request.user.username}' has requested your {trade_profile.trade_category} service for {preferred_date} at {preferred_time_slot}."
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ServiceRequestListView(generics.ListAPIView):
    """
    GET: List all service requests for the logged-in user.
    Shows sent requests for clients, received requests for workers.
    """
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_worker:
            return ServiceRequest.objects.filter(worker=user).order_by('-created_at')
        else:
            return ServiceRequest.objects.filter(client=user).order_by('-created_at')


class ServiceRequestUpdateView(APIView):
    """
    PATCH: Worker accepts, rejects, or marks a service request as completed.
    Also supports worker counter-proposals via worker_notes.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            service_request = ServiceRequest.objects.get(pk=pk)
        except ServiceRequest.DoesNotExist:
            return Response({"error": "Service request not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        worker_notes = request.data.get('worker_notes', '')

        # Only the worker can accept/reject
        if new_status in ['accepted', 'rejected', 'scheduled', 'completed']:
            if service_request.worker != request.user:
                return Response({"error": "Only the assigned worker can update this request."}, status=status.HTTP_403_FORBIDDEN)

        if new_status == 'accepted':
            if service_request.status != 'pending':
                return Response({"error": "Can only accept pending requests."}, status=status.HTTP_400_BAD_REQUEST)
            service_request.status = 'accepted'
            if worker_notes:
                service_request.worker_notes = worker_notes
            service_request.save()

            Notification.objects.create(
                user=service_request.client,
                title="Service Request Accepted!",
                message=f"Worker '{service_request.worker.username}' accepted your {service_request.trade_profile.trade_category} request for {service_request.preferred_date} at {service_request.preferred_time_slot}."
            )
            return Response(ServiceRequestSerializer(service_request).data)

        elif new_status == 'rejected':
            if service_request.status != 'pending':
                return Response({"error": "Can only reject pending requests."}, status=status.HTTP_400_BAD_REQUEST)
            service_request.status = 'rejected'
            if worker_notes:
                service_request.worker_notes = worker_notes
            service_request.save()

            Notification.objects.create(
                user=service_request.client,
                title="Service Request Declined",
                message=f"Worker '{service_request.worker.username}' declined your request. Notes: {worker_notes or 'None'}"
            )
            return Response(ServiceRequestSerializer(service_request).data)

        elif new_status == 'scheduled':
            if service_request.status != 'accepted':
                return Response({"error": "Can only schedule accepted requests."}, status=status.HTTP_400_BAD_REQUEST)
            service_request.status = 'scheduled'
            service_request.save()

            Notification.objects.create(
                user=service_request.client,
                title="Service Scheduled",
                message=f"Your {service_request.trade_profile.trade_category} service with '{service_request.worker.username}' is now confirmed for {service_request.preferred_date} at {service_request.preferred_time_slot}."
            )
            return Response(ServiceRequestSerializer(service_request).data)

        elif new_status == 'completed':
            if service_request.status not in ['accepted', 'scheduled']:
                return Response({"error": "Can only complete accepted or scheduled requests."}, status=status.HTTP_400_BAD_REQUEST)
            service_request.status = 'completed'
            service_request.save()

            Notification.objects.create(
                user=service_request.client,
                title="Service Completed",
                message=f"Worker '{service_request.worker.username}' has marked the {service_request.trade_profile.trade_category} service as completed."
            )
            return Response(ServiceRequestSerializer(service_request).data)

        return Response({"error": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
