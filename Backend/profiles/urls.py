from django.urls import path
from .views import (
    DocumentUploadView,
    MyTradeProfilesView,
    TradeProfileCreateView,
    TradeProfileUpdateView,
    TradeProfileListByCategoryView,
    TradeProfileDetailView,
    ServiceRequestCreateView,
    ServiceRequestListView,
    ServiceRequestUpdateView,
)
from .views_payment import (
    PayServiceRequestView,
    RazorpayVerifyServiceRequestView,
    WorkerCompleteServiceRequestView,
    CompleteServiceRequestView,
    RefundServiceRequestView,
)

urlpatterns = [
    # GET: List my docs, POST: Upload new doc
    path('documents/', DocumentUploadView.as_view(), name='doc-upload'),

    # --- TRADE PROFILES ---
    # POST: Create a new trade profile
    path('trade-profiles/', TradeProfileCreateView.as_view(), name='trade-profile-create'),
    # GET: List all my trade profiles (worker)
    path('trade-profiles/mine/', MyTradeProfilesView.as_view(), name='my-trade-profiles'),
    # PUT/DELETE: Update or delete a specific trade profile
    path('trade-profiles/<int:pk>/', TradeProfileUpdateView.as_view(), name='trade-profile-update'),
    # GET: Browse active profiles by trade category
    path('trade-profiles/category/<str:category>/', TradeProfileListByCategoryView.as_view(), name='trade-profiles-by-category'),
    # GET: View a single trade profile detail
    path('trade-profiles/detail/<int:pk>/', TradeProfileDetailView.as_view(), name='trade-profile-detail'),

    # --- SERVICE REQUESTS ---
    # POST: Client requests service from a trade profile
    path('service-requests/', ServiceRequestCreateView.as_view(), name='service-request-create'),
    # GET: List my service requests (client or worker)
    path('service-requests/mine/', ServiceRequestListView.as_view(), name='service-requests-mine'),
    # PATCH: Worker accepts/rejects
    path('service-requests/<int:pk>/', ServiceRequestUpdateView.as_view(), name='service-request-update'),

    # --- SERVICE REQUEST PAYMENTS & ESCROW ---
    path('service-requests/<int:pk>/pay/', PayServiceRequestView.as_view(), name='service-request-pay'),
    path('service-requests/<int:pk>/verify-payment/', RazorpayVerifyServiceRequestView.as_view(), name='service-request-verify-payment'),
    path('service-requests/<int:pk>/worker-complete/', WorkerCompleteServiceRequestView.as_view(), name='service-request-worker-complete'),
    path('service-requests/<int:pk>/release-funds/', CompleteServiceRequestView.as_view(), name='service-request-release-funds'),
    path('service-requests/<int:pk>/refund/', RefundServiceRequestView.as_view(), name='service-request-refund'),
]