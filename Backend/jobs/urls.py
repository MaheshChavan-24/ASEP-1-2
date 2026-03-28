from django.urls import path
from .views import JobCreateView, JobListView, AcceptJobView, CreateReviewView, WorkerReviewsView, ClientJobListView, CompleteJobView, ActiveJobView, WorkerJobHistoryView, MyReviewsView

urlpatterns = [
    # 1. Client Endpoint: Post a new job
    # URL: http://127.0.0.1:8000/api/jobs/create/
    path('create/', JobCreateView.as_view(), name='job-create'),
    
    # 2. Worker Endpoint: See all 'pending' jobs
    # URL: http://127.0.0.1:8000/api/jobs/available/
    path('available/', JobListView.as_view(), name='job-available'),
    
    # 3. Worker Endpoint: Accept a specific job by its ID
    # URL: http://127.0.0.1:8000/api/jobs/<id>/accept/
    path('<int:pk>/accept/', AcceptJobView.as_view(), name='job-accept'),

     # POST: Create a review
    path('reviews/create/', CreateReviewView.as_view(), name='review-create'),
    
    # GET: List reviews for a specific worker
    path('reviews/worker/<int:worker_id>/', WorkerReviewsView.as_view(), name='worker-reviews'),

    # --- NEW CLIENT ENDPOINT ---
    path('my-jobs/', ClientJobListView.as_view(), name='client-jobs'),

     # --- NEW: Mark job as completed ---
    path('<int:pk>/complete/', CompleteJobView.as_view(), name='job-complete'),

    # --- WORKER ACTIVE JOB ---
    path('active/', ActiveJobView.as_view(), name='active-job'),

      # --- NEW: WORKER HISTORY ---
    path('worker-history/', WorkerJobHistoryView.as_view(), name='worker-history'),

    #My reviews -->
    path('reviews/my-reviews/', MyReviewsView.as_view(), name='my-reviews'),
]