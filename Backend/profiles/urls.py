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
    FetchNearbyWorkersView,
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
    # POST: Create a service request
    path('service-requests/', ServiceRequestCreateView.as_view(), name='service-request-create'),
    # GET: List all service requests (for logged-in user)
    path('service-requests/mine/', ServiceRequestListView.as_view(), name='my-service-requests'),
    # PATCH: Update a service request status
    path('service-requests/<int:pk>/', ServiceRequestUpdateView.as_view(), name='service-request-update'),

    # --- GEOSPATIAL PROXIMITY ---
    path('nearby-workers/', FetchNearbyWorkersView.as_view(), name='nearby-workers'),
]