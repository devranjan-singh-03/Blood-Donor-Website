from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.core.mail import send_mail           # ✅ NEW
from django.conf import settings                  # ✅ NEW
from django.db.models import Q, Count
from django.db.models.functions import TruncMonth
from datetime import datetime
import csv
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from .models import Donor
from .forms import DonorForm


def is_admin(user):
    return user.is_authenticated and user.is_staff


# ============================================
# EMAIL HELPER
# ============================================
def send_donor_email(subject, message, donor_email):
    """Send email notification"""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[donor_email],
            fail_silently=True,
        )
    except Exception as e:
        print(f"Email error: {e}")


# ============================================
# HOME
# ============================================
def home(request):
    blood_groups = {
        bg: Donor.objects.filter(blood_group=bg).count()
        for bg, _ in Donor.BLOOD_GROUPS
    }
    return render(request, 'donor_app/home.html', {
        'total_donors': Donor.objects.count(),
        'available_donors': Donor.objects.filter(is_available=True).count(),
        'blood_groups': blood_groups,
    })


# ============================================
# DASHBOARD
# ============================================
@login_required(login_url='/accounts/login/')
def dashboard(request):
    return render(request, 'donor_app/dashboard.html', {
        'total_donors': Donor.objects.count(),
        'available_donors': Donor.objects.filter(is_available=True).count(),
        'unavailable_donors': Donor.objects.filter(is_available=False).count(),
    })


# ============================================
# ADD DONOR (+ Email)
# ============================================
@login_required(login_url='/accounts/login/')
def add_donor(request):
    if request.method == 'POST':
        form = DonorForm(request.POST, request.FILES)   # ✅ request.FILES for image
        if form.is_valid():
            donor = form.save()
            
            # ✅ Email notification
            send_donor_email(
                subject='Welcome to Bhumi Blood Donor! 🩸',
                message=f"""Hi {donor.first_name},

Thank you for registering as a blood donor with Bhumi Blood Donor!

Your Details:
- Blood Group: {donor.blood_group}
- City: {donor.city}
- Status: {'Available' if donor.is_available else 'Not Available'}

Your registration helps save lives. We'll contact you when someone needs your blood type.

Stay healthy!
- Team Bhumi Blood Donor""",
                donor_email=donor.email,
            )
            
            messages.success(request, f'Donor {donor.first_name} {donor.last_name} added successfully!')
            return redirect('donor_list')
    else:
        form = DonorForm()
    return render(request, 'donor_app/add_donor.html', {'form': form})


# ============================================
# DONOR LIST
# ============================================
def donor_list(request):
    donors = Donor.objects.all()
    blood_group = request.GET.get('blood_group', '')
    city = request.GET.get('city', '')
    availability = request.GET.get('availability', '')
    
    if blood_group:
        donors = donors.filter(blood_group=blood_group)
    if city:
        donors = donors.filter(city__icontains=city)
    if availability:
        donors = donors.filter(is_available=(availability == 'available'))
    
    return render(request, 'donor_app/donor_list.html', {
        'donors': donors,
        'blood_groups': Donor.BLOOD_GROUPS,
        'selected_blood_group': blood_group,
        'selected_city': city,
        'selected_availability': availability,
    })


# ============================================
# DONOR DETAILS
# ============================================
def donor_details(request, donor_id):
    donor = get_object_or_404(Donor, id=donor_id)
    return render(request, 'donor_app/donor_details.html', {'donor': donor})


# ============================================
# EDIT DONOR (+ Email)
# ============================================
@login_required(login_url='/accounts/login/')
@user_passes_test(is_admin, login_url='/accounts/login/')
def edit_donor(request, donor_id):
    donor = get_object_or_404(Donor, id=donor_id)
    if request.method == 'POST':
        form = DonorForm(request.POST, request.FILES, instance=donor)   # ✅ request.FILES
        if form.is_valid():
            form.save()
            
            # ✅ Email notification
            send_donor_email(
                subject='Your Bhumi Donor Profile Updated 📝',
                message=f"""Hi {donor.first_name},

Your donor profile has been updated.

Current Details:
- Blood Group: {donor.blood_group}
- City: {donor.city}
- Status: {'Available' if donor.is_available else 'Not Available'}

Thank you for keeping your information up to date!

- Team Bhumi Blood Donor""",
                donor_email=donor.email,
            )
            
            messages.success(request, 'Donor updated successfully!')
            return redirect('donor_details', donor_id=donor.id)
    else:
        form = DonorForm(instance=donor)
    return render(request, 'donor_app/edit_donor.html', {'form': form, 'donor': donor})


# ============================================
# DELETE DONOR (+ Email)
# ============================================
@login_required(login_url='/accounts/login/')
@user_passes_test(is_admin, login_url='/accounts/login/')
def delete_donor(request, donor_id):
    donor = get_object_or_404(Donor, id=donor_id)
    if request.method == 'POST':
        email = donor.email
        name = donor.first_name
        
        donor.delete()
        
        # ✅ Email notification
        send_donor_email(
            subject='Bhumi Donor Profile Removed',
            message=f"""Hi {name},

Your donor profile has been removed from Bhumi Blood Donor.

If this was a mistake, please register again.

- Team Bhumi Blood Donor""",
            donor_email=email,
        )
        
        messages.success(request, 'Donor deleted successfully!')
        return redirect('donor_list')
    return render(request, 'donor_app/delete_donor.html', {'donor': donor})


# ============================================
# SEARCH
# ============================================
def search_donor(request):
    query = request.GET.get('q', '').strip()
    results = []
    if query:
        results = Donor.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query) |
            Q(phone__icontains=query) |
            Q(city__icontains=query)
        )
    return render(request, 'donor_app/search_donor.html', {
        'results': results,
        'query': query,
    })


# ============================================
# API: SEARCH
# ============================================
def search_donor_api(request):
    query = request.GET.get('q', '').strip()
    results = []
    if query:
        donors = Donor.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(blood_group__icontains=query) |
            Q(phone__icontains=query) |
            Q(city__icontains=query)
        )[:10]
        results = [
            {
                'id': d.id,
                'name': f"{d.first_name} {d.last_name}",
                'blood_group': d.blood_group,
                'phone': d.phone,
                'city': d.city,
                'profile_picture': d.profile_picture.url if d.profile_picture else '',
            }
            for d in donors
        ]
    return JsonResponse({'results': results})


# ============================================
# API: STATS
# ============================================
def get_blood_group_stats(request):
    stats = {
        bg: Donor.objects.filter(blood_group=bg).count()
        for bg, _ in Donor.BLOOD_GROUPS
    }
    return JsonResponse(stats)


def get_monthly_stats(request):
    data = (
        Donor.objects
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    result = {
        'labels': [item['month'].strftime('%b %Y') for item in data if item['month']],
        'values': [item['count'] for item in data if item['month']],
    }
    return JsonResponse(result)


# ============================================
# EXPORT: CSV
# ============================================
@login_required(login_url='/accounts/login/')
def export_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="donors.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Name', 'Blood Group', 'Phone', 'Email', 'City', 'State', 'Available'])
    
    for donor in Donor.objects.all():
        writer.writerow([
            f"{donor.first_name} {donor.last_name}",
            donor.blood_group,
            donor.phone,
            donor.email,
            donor.city,
            donor.state,
            'Yes' if donor.is_available else 'No',
        ])
    return response


# ============================================
# EXPORT: PDF
# ============================================
@login_required(login_url='/accounts/login/')
def export_pdf(request):
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="donors.pdf"'
    
    p = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    
    p.setFont('Helvetica-Bold', 18)
    p.drawString(50, height - 50, 'Bhumi Blood Donor - Donor List')
    
    p.setFont('Helvetica', 10)
    p.drawString(50, height - 70, f'Generated: {datetime.now().strftime("%d %b %Y, %I:%M %p")}')
    p.drawString(50, height - 85, f'Total Donors: {Donor.objects.count()}')
    
    y = height - 120
    p.setFont('Helvetica-Bold', 11)
    p.drawString(50, y, 'Name')
    p.drawString(200, y, 'Blood')
    p.drawString(260, y, 'Phone')
    p.drawString(360, y, 'City')
    p.drawString(460, y, 'Available')
    
    y -= 20
    p.setFont('Helvetica', 10)
    
    for donor in Donor.objects.all():
        if y < 50:
            p.showPage()
            y = height - 50
        p.drawString(50, y, f"{donor.first_name} {donor.last_name}"[:22])
        p.drawString(200, y, donor.blood_group)
        p.drawString(260, y, donor.phone)
        p.drawString(360, y, donor.city[:15])
        p.drawString(460, y, 'Yes' if donor.is_available else 'No')
        y -= 18
    
    p.save()
    return response