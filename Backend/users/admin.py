from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

# Register the custom User model
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('is_client', 'is_worker', 'is_admin', 'phone_number', 'address_lat', 'address_lng')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('is_client', 'is_worker', 'is_admin', 'phone_number')}),
    )
    list_display = ['username', 'email', 'is_client', 'is_worker', 'is_staff']