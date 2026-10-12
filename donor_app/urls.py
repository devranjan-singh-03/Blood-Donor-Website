from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('add/', views.add_donor, name='add_donor'),
    path('donors/', views.donor_list, name='donor_list'),
    path('donor/<int:donor_id>/', views.donor_details, name='donor_details'),
    path('donor/<int:donor_id>/edit/', views.edit_donor, name='edit_donor'),
    path('donor/<int:donor_id>/delete/', views.delete_donor, name='delete_donor'),
    path('search/', views.search_donor, name='search_donor'),
    path('api/search/', views.search_donor_api, name='search_donor_api'),
    path('api/stats/', views.get_blood_group_stats, name='blood_group_stats'),
    path('api/monthly-stats/', views.get_monthly_stats, name='monthly_stats'),
    path('export/csv/', views.export_csv, name='export_csv'),
    path('export/pdf/', views.export_pdf, name='export_pdf'),
]