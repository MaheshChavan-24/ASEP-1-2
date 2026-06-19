import razorpay
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import ServiceRequest
from users.models import Notification

def create_notification(user, title, message):
    Notification.objects.create(user=user, title=title, message=message)

class PayServiceRequestView(APIView):
    """
    POST: Client pays the service request amount. Holds funds in escrow.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            req = ServiceRequest.objects.get(pk=pk)
        except ServiceRequest.DoesNotExist:
            return Response({"error": "Service request not found."}, status=status.HTTP_404_NOT_FOUND)

        if req.client != request.user:
            return Response({"error": "You are not authorized to pay for this request."}, status=status.HTTP_403_FORBIDDEN)

        if req.status != 'accepted':
            return Response({"error": "Service request must be accepted by worker first."}, status=status.HTTP_400_BAD_REQUEST)

        if req.escrow_status != 'pending':
            return Response({"error": f"Payment is not pending. Escrow status: {req.escrow_status}"}, status=status.HTTP_400_BAD_REQUEST)

        payment_method = request.data.get('method', 'razorpay')

        if payment_method == 'simulated':
            req.escrow_status = 'held'
            req.payment_method = 'simulated'
            req.paid_at = timezone.now()
            req.save()

            create_notification(req.worker, "Escrow Funded (Simulated)", f"Client has secured ₹{req.budget} in escrow for {req.trade_profile.trade_category}.")
            create_notification(req.client, "Payment Secured", f"Funds of ₹{req.budget} secured in escrow.")

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
                order_amount = int(req.budget * 100)
                order_currency = 'INR'
                order_receipt = f'sr_receipt_{req.id}'
                
                razorpay_order = client.order.create(dict(amount=order_amount, currency=order_currency, receipt=order_receipt))
                
                req.razorpay_order_id = razorpay_order['id']
                req.payment_method = 'razorpay'
                req.save()

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


class RazorpayVerifyServiceRequestView(APIView):
    """
    POST: Verifies Razorpay signature after frontend checkout success.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            req = ServiceRequest.objects.get(pk=pk)
        except ServiceRequest.DoesNotExist:
            return Response({"error": "Service request not found."}, status=status.HTTP_404_NOT_FOUND)
            
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
            
        if req.escrow_status == 'pending':
            req.escrow_status = 'held'
            req.razorpay_payment_id = razorpay_payment_id
            req.razorpay_signature = razorpay_signature
            req.paid_at = timezone.now()
            req.save()

            create_notification(req.worker, "Escrow Funded (Razorpay)", f"Client has paid via Razorpay. Escrow of ₹{req.budget} is now secured.")
            create_notification(req.client, "Payment Confirmed", f"Payment of ₹{req.budget} confirmed via Razorpay. Escrow is secured!")
            
        return Response({"status": "success", "message": "Payment verified successfully."}, status=status.HTTP_200_OK)


class WorkerCompleteServiceRequestView(APIView):
    """
    POST: Worker marks the service request as completed.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            req = ServiceRequest.objects.get(pk=pk)
        except ServiceRequest.DoesNotExist:
            return Response({"error": "Service request not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user != req.worker:
            return Response({"error": "Only the assigned worker can mark this as completed."}, status=status.HTTP_403_FORBIDDEN)

        if req.escrow_status != 'held':
            return Response({"error": "Cannot complete work unless funds are held in escrow."}, status=status.HTTP_400_BAD_REQUEST)

        req.status = 'worker_completed'
        req.save()

        create_notification(req.client, "Service Marked Completed", f"Worker {req.worker.username} has marked {req.trade_profile.trade_category} request as completed. Please review and release funds.")
        return Response({"message": "Service marked as completed.", "status": "worker_completed"})


class CompleteServiceRequestView(APIView):
    """
    POST: Client approves the completed service request and releases the escrow to the worker.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            req = ServiceRequest.objects.get(pk=pk)
        except ServiceRequest.DoesNotExist:
            return Response({"error": "Service request not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user != req.client:
            return Response({"error": "Only the client can release funds."}, status=status.HTTP_403_FORBIDDEN)

        if req.status != 'worker_completed':
            return Response({"error": "Worker has not marked this as completed yet."}, status=status.HTTP_400_BAD_REQUEST)

        if req.escrow_status != 'held':
            return Response({"error": "Funds are not held in escrow."}, status=status.HTTP_400_BAD_REQUEST)

        req.status = 'completed'
        req.escrow_status = 'released'
        req.released_at = timezone.now()
        req.save()

        worker = req.worker
        worker.wallet_balance += req.budget
        worker.save()

        create_notification(worker, "Funds Released", f"Client has released ₹{req.budget} for the {req.trade_profile.trade_category} request. Funds added to your wallet!")
        create_notification(req.client, "Service Request Completed", f"You have successfully released funds for {req.trade_profile.trade_category}.")

        return Response({"message": "Escrow released successfully to worker's wallet.", "escrow_status": "released", "status": "completed"})


class RefundServiceRequestView(APIView):
    """
    POST: Handle cancel and refund for escrowed funds.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            req = ServiceRequest.objects.get(pk=pk)
        except ServiceRequest.DoesNotExist:
            return Response({"error": "Service request not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user != req.client and user != req.worker:
            return Response({"error": "You are not authorized to cancel this request."}, status=status.HTTP_403_FORBIDDEN)
        
        if req.escrow_status == 'none' or req.escrow_status == 'pending':
            req.status = 'rejected'
            req.escrow_status = 'none'
            req.save()

            if user == req.worker:
                create_notification(req.client, "Request Cancelled", f"Worker {user.username} cancelled the {req.trade_profile.trade_category} request.")
            else:
                create_notification(req.worker, "Request Cancelled", f"Client cancelled the {req.trade_profile.trade_category} request.")

            return Response({"message": "Service request cancelled successfully.", "escrow_status": "none"}, status=status.HTTP_200_OK)

        elif req.escrow_status == 'held':
            if req.status == 'worker_completed':
                return Response({"error": "Worker has marked this as completed. You cannot unilaterally cancel. Please release funds or raise a dispute."}, status=status.HTTP_403_FORBIDDEN)
                
            if req.payment_method == 'razorpay':
                if settings.RAZORPAY_KEY_ID and not settings.RAZORPAY_KEY_ID.startswith('rzp_test_placeholder'):
                    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                    try:
                        if req.razorpay_payment_id:
                            client.payment.refund(req.razorpay_payment_id, {'amount': int(req.budget * 100)})
                    except Exception as refund_err:
                        return Response({"error": f"Razorpay refund failed: {str(refund_err)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            req.escrow_status = 'refunded'
            req.status = 'rejected'
            req.save()

            create_notification(req.client, "Refund Issued", f"Your payment of ₹{req.budget} for {req.trade_profile.trade_category} has been refunded.")
            create_notification(req.worker, "Request Cancelled & Refunded", f"The {req.trade_profile.trade_category} request was cancelled, and escrow refunded to the client.")

            return Response({
                "message": "Escrow successfully refunded!",
                "escrow_status": "refunded"
            }, status=status.HTTP_200_OK)

        else:
            return Response({"error": f"Cannot refund in current state. Escrow status: {req.escrow_status}"}, status=status.HTTP_400_BAD_REQUEST)
