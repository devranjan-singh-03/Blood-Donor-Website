# 🩸 Bhumi Blood Donor Management System

A complete blood donor management system built with Django.

## ✨ Features
- 👤 User Authentication (Signup/Login/Logout)
- 🔒 Role-Based Access (Admin only edit/delete)
- 🖼️ Profile Pictures
- 📊 Dashboard with Charts
- 🔍 Live Search (AJAX)
- 📄 Export CSV/PDF
- 📧 Email Notifications
- 🔔 Toast Notifications
- 🌙 Dark Mode
- 📱 PWA (Installable)
- 📱 Fully Responsive

## 🛠️ Tech Stack
- **Backend:** Django 4.2, Python 3.12
- **Database:** SQLite
- **Auth:** django-allauth
- **Charts:** Chart.js
- **PDF:** ReportLab
- **Frontend:** HTML5, CSS3, JavaScript
- **Icons:** Font Awesome 6

## 🚀 Setup

```bash
git clone https://github.com/YOUR-USERNAME/blood-donor.git
cd blood-donor
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver