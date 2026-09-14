from django.contrib import admin
from .models import Donor

@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'blood_group', 'city', 'phone', 'is_available']
    list_filter = ['blood_group', 'city', 'is_available']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    list_editable = ['is_available']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'