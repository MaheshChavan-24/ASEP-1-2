from django.contrib import admin
from .models import WorkerDocument

@admin.register(WorkerDocument)
class WorkerDocumentAdmin(admin.ModelAdmin):
    list_display = ('worker', 'document_type', 'status', 'uploaded_at')
    list_filter = ('status', 'document_type', 'uploaded_at')
    search_fields = ('worker__username', 'document_type')
    
    # This allows admins to click the file link to view it
    readonly_fields = ('uploaded_at',) 
    
    # Allow status updates directly from the list view
    list_editable = ('status',)