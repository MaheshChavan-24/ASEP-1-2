from django.contrib import admin
from .models import WorkerDocument, TradeProfile, ServiceRequest

@admin.register(WorkerDocument)
class WorkerDocumentAdmin(admin.ModelAdmin):
    list_display = ('worker', 'document_type', 'status', 'uploaded_at')
    list_filter = ('status', 'document_type', 'uploaded_at')
    search_fields = ('worker__username', 'document_type')
    
    # This allows admins to click the file link to view it
    readonly_fields = ('uploaded_at',) 
    
    # Allow status updates directly from the list view
    list_editable = ('status',)


@admin.register(TradeProfile)
class TradeProfileAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'worker', 'trade_category', 'years_of_experience', 'is_active', 'updated_at')
    list_filter = ('trade_category', 'is_active', 'years_of_experience')
    search_fields = ('display_name', 'worker__username', 'skills')
    list_editable = ('is_active',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ('client', 'worker', 'trade_profile', 'preferred_date', 'preferred_time_slot', 'status', 'created_at')
    list_filter = ('status', 'preferred_date')
    search_fields = ('client__username', 'worker__username', 'description')
    list_editable = ('status',)
    readonly_fields = ('created_at',)