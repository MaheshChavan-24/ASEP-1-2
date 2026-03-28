from django.contrib import admin
from .models import Job

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    # This controls which columns you see in the list view
    list_display = ('title', 'client', 'service_type', 'status', 'budget', 'created_at')
    
    # This adds a filter sidebar on the right
    list_filter = ('status', 'service_type', 'created_at')
    
    # This adds a search bar at the top
    search_fields = ('title', 'description', 'address', 'client__username')
    
    # This allows you to click and change status directly from the list
    list_editable = ('status',)