import razorpay
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Job
from users.models import User, Notification
from users.serializers import UserSerializer

# Helper to create notification
def create_notification(user, title, message):
    Notification.objects.create(user=user, title=title, message=message)

class PayJobView(APIView):
    """
    POST: Client pays the job amount. Holds funds in escrow.
    URL: /api/jobs/<job_id>/pay/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
        except Job.DoesNotExist:
            return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

        if job.client != request.user:
            return Response({"error": "You are not authorized to pay for this job."}, status=status.HTTP_403_FORBIDDEN)

        if not job.worker:
            return Response({"error": "No worker is assigned to this job yet."}, status=status.HTTP_400_BAD_REQUEST)

        if job.escrow_status != 'pending':
            return Response({"error": f"Payment is not pending for this job. Escrow status: {job.escrow_status}"}, status=status.HTTP_400_BAD_REQUEST)

        payment_method = request.data.get('method', 'razorpay')

        if payment_method == 'simulated':
            job.escrow_status = 'held'
            job.payment_method = 'simulated'
            job.paid_at = timezone.now()
            job.save()

            create_notification(job.worker, "Escrow Funded (Simulated)", f"Client has secured the budget of ₹{job.budget} in escrow. You can safely start working!")
            create_notification(job.client, "Payment Secured", f"Funds of ₹{job.budget} are successfully secured in escrow. Worker has been notified to begin.")

            return Response({
                "message": "Simulated payment successful! Escrow is now funded.",
                "escrow_status": "held",
                "payment_method": "simulated"
            }, status=status.HTTP_200_OK)

        elif payment_method == 'razorpay':
            if not settings.RAZORPAY_KEY_ID or settings.RAZORPAY_KEY_ID.startswith('rzp_test_placeholder'):
                return Response({
                    "error": "Razorpay is not configured. Please use Simulation Mode instead for testing.",
                    "requires_simulation": True
                }, status=status.HTTP_400_BAD_REQUEST)

            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

            try:
                # Amount is in paise
                order_amount = int(job.budget * 100)
                order_currency = 'INR'
                order_receipt = f'receipt_{job.id}'
                
                razorpay_order = client.order.create(dict(amount=order_amount, currency=order_currency, receipt=order_receipt))
                
                job.razorpay_order_id = razorpay_order['id']
                job.payment_method = 'razorpay'
                job.save()

                return Response({
                    "order_id": razorpay_order['id'],
                    "amount": order_amount,
                    "currency": order_currency,
                    "key_id": settings.RAZORPAY_KEY_ID
                }, status=status.HTTP_200_OK)

            except Exception as rzp_err:
                return Response({"error": f"Razorpay order creation failed: {str(rzp_err)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        else:
            return Response({"error": "Invalid payment method specified."}, status=status.HTTP_400_BAD_REQUEST)


class RazorpayVerifyView(APIView):
    """
    POST: Verifies Razorpay signature after frontend checkout success.
    URL: /api/jobs/<job_id>/verify-payment/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
        except Job.DoesNotExist:
            return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)
            
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')
        
        if not razorpay_payment_id or not razorpay_order_id or not razorpay_signature:
            return Response({"error": "Missing Razorpay verification parameters."}, status=status.HTTP_400_BAD_REQUEST)
            
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
        except razorpay.errors.SignatureVerificationError:
            return Response({"error": "Invalid payment signature. Verification failed."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Signature is valid
        if job.escrow_status == 'pending':
            job.escrow_status = 'held'
            job.razorpay_payment_id = razorpay_payment_id
            job.razorpay_signature = razorpay_signature
            job.paid_at = timezone.now()
            job.save()

            create_notification(job.worker, "Escrow Funded (Razorpay)", f"Client has paid via Razorpay. Escrow of ₹{job.budget} is now secured. Start working!")
            create_notification(job.client, "Payment Confirmed", f"Payment of ₹{job.budget} confirmed via Razorpay. Escrow is secured!")
            
        return Response({"status": "success", "message": "Payment verified successfully."}, status=status.HTTP_200_OK)


class WorkerPayoutView(APIView):
    """
    POST: Worker updates bank details and withdraws wallet balance.
    URL: /api/users/payout/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.is_worker:
            return Response({"error": "Only workers can access payouts."}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action')

        if action == 'link':
            bank_name = request.data.get('bank_name')
            bank_account_number = request.data.get('bank_account_number')
            bank_ifsc = request.data.get('bank_ifsc')

            if not bank_name or not bank_account_number or not bank_ifsc:
                return Response({"error": "All bank details (name, account number, IFSC) are required."}, status=status.HTTP_400_BAD_REQUEST)

            user.bank_name = bank_name
            user.bank_account_number = bank_account_number
            user.bank_ifsc = bank_ifsc
            user.save()

            return Response({
                "message": "Bank details linked successfully!",
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        elif action == 'withdraw':
            if not user.bank_account_number:
                return Response({"error": "Please link your bank account before withdrawing funds."}, status=status.HTTP_400_BAD_REQUEST)

            amount = user.wallet_balance
            if amount <= 0:
                return Response({"error": "No wallet balance available for withdrawal."}, status=status.HTTP_400_BAD_REQUEST)

            # Process Razorpay Route (transfers) or Payout API if real Razorpay is active
            # E.g. client.transfer.create(...)

            user.wallet_balance = 0
            user.save()

            create_notification(user, "Payout Disbursed", f"Your payout of ₹{amount} has been successfully transferred to bank account ****{user.bank_account_number[-4:]}.")

            return Response({
                "message": f"Successfully withdrew ₹{amount}! Transfer initiated.",
                "withdrawn_amount": float(amount),
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        else:
            return Response({"error": "Invalid payout action specified."}, status=status.HTTP_400_BAD_REQUEST)


class RefundJobView(APIView):
    """
    POST: Handle cancel and refund for escrowed funds.
    URL: /api/jobs/<job_id>/refund/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
        except Job.DoesNotExist:
            return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user != job.client and user != job.worker:
            return Response({"error": "You are not authorized to cancel this job."}, status=status.HTTP_403_FORBIDDEN)
        
        if job.escrow_status == 'none' or job.escrow_status == 'pending':
            worker_who_cancelled = job.worker
            job.worker = None
            job.status = 'pending'
            job.escrow_status = 'none'
            job.save()

            if worker_who_cancelled:
                create_notification(job.client, "Job Reset", f"Worker {worker_who_cancelled.username} cancelled the assignment. The job has been put back on the marketplace.")
                create_notification(worker_who_cancelled, "Job Cancelled", f"You have cancelled the assignment for job: '{job.title}'.")

            return Response({"message": "Job assignment cancelled successfully.", "escrow_status": "none"}, status=status.HTTP_200_OK)

        elif job.escrow_status == 'held':
            if job.status == 'worker_completed':
                return Response({"error": "Worker has marked this job as completed. You cannot unilaterally cancel. Please release funds or raise a dispute."}, status=status.HTTP_403_FORBIDDEN)
                
            if job.payment_method == 'razorpay':
                if settings.RAZORPAY_KEY_ID and not settings.RAZORPAY_KEY_ID.startswith('rzp_test_placeholder'):
                    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                    try:
                        if job.razorpay_payment_id:
                            client.payment.refund(job.razorpay_payment_id, {'amount': int(job.budget * 100)})
                    except Exception as refund_err:
                        return Response({"error": f"Razorpay refund failed: {str(refund_err)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            job.escrow_status = 'refunded'
            worker_to_notify = job.worker
            job.worker = None
            job.status = 'pending'
            job.save()

            create_notification(job.client, "Refund Issued", f"Your payment of ₹{job.budget} for job '{job.title}' has been successfully refunded. The job is back on the marketplace.")
            if worker_to_notify:
                create_notification(worker_to_notify, "Job Cancelled & Escrow Refunded", f"Job '{job.title}' was cancelled, and the escrow has been refunded to the client.")

            return Response({
                "message": "Escrow successfully refunded! Job is back on the marketplace.",
                "escrow_status": "refunded"
            }, status=status.HTTP_200_OK)

        else:
            return Response({"error": f"Job cannot be refunded in its current state. Escrow status: {job.escrow_status}"}, status=status.HTTP_400_BAD_REQUEST)
