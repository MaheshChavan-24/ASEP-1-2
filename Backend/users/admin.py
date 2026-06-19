from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Notification

# Register the custom User model
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Roles & Address', {'fields': ('is_client', 'is_worker', 'is_admin', 'phone_number', 'address_lat', 'address_lng')}),
        ('Verification', {'fields': ('verification_status', 'id_type', 'id_front_image', 'id_back_image', 'id_selfie_image', 'rejection_reason', 'submitted_at', 'reviewed_at')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Roles', {'fields': ('is_client', 'is_worker', 'is_admin', 'phone_number')}),
    )
    list_display = ['username', 'email', 'is_client', 'is_worker', 'verification_status', 'is_staff']
    list_filter = UserAdmin.list_filter + ('verification_status', 'is_client', 'is_worker')
    search_fields = UserAdmin.search_fields + ('phone_number',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['user__username', 'title', 'message']