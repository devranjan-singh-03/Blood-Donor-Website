from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.contrib import messages
from .models import Donor
from .forms import DonorForm
from datetime import datetime

def home(request):
    total_donors = Donor.objects.count()
    available_donors = Donor.objects.filter(is_available=True).count()
    blood_groups = {
        'A+': Donor.objects.filter(blood_group='A+').count(),
        'A-': Donor.objects.filter(blood_group='A-').count(),
        'B+': Donor.objects.filter(blood_group='B+').count(),
        'B-': Donor.objects.filter(blood_group='B-').count(),
        'AB+': Donor.objects.filter(blood_group='AB+').count(),
        'AB-': Donor.objects.filter(blood_group='AB-').count(),
        'O+': Donor.objects.filter(blood_group='O+').count(),
        'O-': Donor.objects.filter(blood_group='O-').count(),
    }
    
    context = {
        'total_donors': total_donors,
        'available_donors': available_donors,
        'blood_groups': blood_groups,
    }
    return render(request, 'donor_app/home.html', context)

def add_donor(request):
    if request.method == 'POST':
        form = DonorForm(request.POST)
        if form.is_valid():
            donor = form.save()
            messages.success(request, f'Donor {donor.first_name} {donor.last_name} added successfully!')
            return redirect('donor_list')
    else:
        form = DonorForm()
    return render(request, 'donor_app/add_donor.html', {'form': form})

def donor_list(request):
    donors = Donor.objects.all()
    blood_group_filter = request.GET.get('blood_group', '')
    city_filter = request.GET.get('city', '')
    availability_filter = request.GET.get('availability', '')
    
    if blood_group_filter:
        donors = donors.filter(blood_group=blood_group_filter)
    if city_filter:
        donors = donors.filter(city__icontains=city_filter)
    if availability_filter:
        is_available = availability_filter == 'available'
        donors = donors.filter(is_available=is_available)
    
    context = {
        'donors': donors,
        'blood_groups': Donor.BLOOD_GROUPS,
        'selected_blood_group': blood_group_filter,
        'selected_city': city_filter,
        'selected_availability': availability_filter,
    }
    return render(request, 'donor_app/donor_list.html', context)

def donor_details(request, donor_id):
    donor = get_object_or_404(Donor, id=donor_id)
    return render(request, 'donor_app/donor_details.html', {'donor': donor})

def edit_donor(request, donor_id):
    donor = get_object_or_404(Donor, id=donor_id)
    if request.method == 'POST':
        form = DonorForm(request.POST, instance=donor)
        if form.is_valid():
            form.save()
            messages.success(request, 'Donor updated successfully!')
            return redirect('donor_details', donor_id=donor.id)
    else:
        form = DonorForm(instance=donor)
    return render(request, 'donor_app/edit_donor.html', {'form': form, 'donor': donor})

def delete_donor(request, donor_id):
    donor = get_object_or_404(Donor, id=donor_id)
    if request.method == 'POST':
        donor.delete()
        messages.success(request, 'Donor deleted successfully!')
        return redirect('donor_list')
    return render(request, 'donor_app/delete_donor.html', {'donor': donor})

def search_donor(request):
    query = request.GET.get('q', '')
    results = []
    if query:
        results = Donor.objects.filter(
            models.Q(first_name__icontains=query) |
            models.Q(last_name__icontains=query) |
            models.Q(email__icontains=query) |
            models.Q(phone__icontains=query) |
            models.Q(city__icontains=query)
        )
    return render(request, 'donor_app/search_donor.html', {'results': results, 'query': query})

# API endpoints for AJAX requests
def search_donor_api(request):
    query = request.GET.get('q', '')
    results = []
    if query:
        donors = Donor.objects.filter(
            models.Q(first_name__icontains=query) |
            models.Q(last_name__icontains=query) |
            models.Q(blood_group__icontains=query)
        )[:10]
        results = [{'id': d.id, 'name': f"{d.first_name} {d.last_name}", 'blood_group': d.blood_group, 'phone': d.phone} for d in donors]
    return JsonResponse({'results': results})

def get_blood_group_stats(request):
    stats = {}
    for bg, _ in Donor.BLOOD_GROUPS:
        stats[bg] = Donor.objects.filter(blood_group=bg).count()
    return JsonResponse(stats)