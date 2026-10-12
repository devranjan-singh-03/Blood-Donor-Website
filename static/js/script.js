// ============================================
// BHUMI BLOOD DONOR — MAIN SCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    autoHideMessages();
    initializeDatePicker();
    initializeFormValidation();
    initializeBloodGroupStats();
    setupLiveSearch();
    setupSmoothScroll();
    setupBackToTop();
    setupThemeToggle();
});

// ============================================
// 1. AUTO-HIDE MESSAGES
// ============================================
function autoHideMessages() {
    const messages = document.querySelectorAll('.alert');
    messages.forEach((message, index) => {
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-20px)';
            setTimeout(() => message.remove(), 500);
        }, 5000 + index * 1000);
    });
}

// ============================================
// 2. DATE PICKER (DOB max = 18 years ago)
// ============================================
function initializeDatePicker() {
    const dobInput = document.querySelector('input[name="date_of_birth"]');
    if (!dobInput) return;
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    dobInput.max = maxDate.toISOString().split('T')[0];
}

// ============================================
// 3. FORM VALIDATION
// ============================================
function initializeFormValidation() {
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function (e) {
            let isValid = true;

            // Required fields
            this.querySelectorAll('[required]').forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = '#fc8181';
                    isValid = false;
                } else {
                    field.style.borderColor = '#48bb78';
                }
            });

            // Phone (10 digits)
            const phone = this.querySelector('input[name="phone"]');
            if (phone && phone.value && !/^[0-9]{10}$/.test(phone.value)) {
                alert('Please enter a valid 10-digit phone number');
                isValid = false;
            }

            // Email
            const email = this.querySelector('input[name="email"]');
            if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
                alert('Please enter a valid email address');
                isValid = false;
            }

            if (!isValid) e.preventDefault();
        });
    });
}

// ============================================
// 4. BLOOD GROUP STATS (AJAX)
// ============================================
function initializeBloodGroupStats() {
    if (!document.querySelector('.blood-grid')) return;

    fetch('/api/stats/')
        .then(res => res.json())
        .then(data => {
            document.querySelectorAll('.blood-card').forEach(card => {
                const type = card.querySelector('.blood-type')?.textContent;
                const count = card.querySelector('.blood-count');
                if (type && count && data[type] !== undefined) {
                    count.textContent = `${data[type]} donors`;
                }
            });
        })
        .catch(err => console.error('Stats error:', err));
}

// ============================================
// 5. LIVE SEARCH (AJAX)
// ============================================
function setupLiveSearch() {
    const input = document.getElementById('searchInput');
    const container = document.getElementById('searchResults');
    if (!input || !container) return;

    let timeout = null;

    input.addEventListener('input', function () {
        clearTimeout(timeout);
        const query = this.value.trim();

        if (query.length < 2) {
            container.innerHTML = `
                <div class="search-hint">
                    <i class="fas fa-search fa-3x"></i>
                    <p>Enter at least 2 characters to search</p>
                </div>`;
            return;
        }

        timeout = setTimeout(() => {
            fetch(`/api/search/?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => displaySearchResults(data.results))
                .catch(err => console.error('Search error:', err));
        }, 300);
    });
}

function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search fa-3x"></i>
                <p>No donors found matching your search.</p>
            </div>`;
        return;
    }

    let html = '<div class="search-results-grid">';
    results.forEach(donor => {
        html += `
            <div class="result-card">
                <div class="result-header">
                    <h4>${donor.name}</h4>
                    <span class="blood-group">${donor.blood_group}</span>
                </div>
                <div class="result-info">
                    <p><i class="fas fa-phone"></i> ${donor.phone}</p>
                </div>
                <a href="/donor/${donor.id}/" class="btn btn-sm btn-info">View Details</a>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// 6. SMOOTH SCROLL
// ============================================
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ============================================
// 7. BACK TO TOP
// ============================================
function setupBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        btn.classList.toggle('show', window.scrollY > 300);
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================
// 8. THEME TOGGLE (DARK MODE)
// ============================================
function setupThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    const body = document.body;
    const icon = toggle.querySelector('i');
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Apply saved/system theme
    const isDark = saved === 'dark' || (!saved && prefersDark);
    applyTheme(isDark);

    // Toggle click
    toggle.addEventListener('click', () => {
        const newDark = !body.classList.contains('dark-mode');
        applyTheme(newDark);
        localStorage.setItem('theme', newDark ? 'dark' : 'light');

        // Animation
        toggle.style.transform = 'rotate(360deg) scale(1.1)';
        setTimeout(() => (toggle.style.transform = ''), 400);
    });

    // System preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) applyTheme(e.matches);
    });

    function applyTheme(dark) {
        body.classList.toggle('dark-mode', dark);
        if (icon) {
            icon.classList.toggle('fa-moon', !dark);
            icon.classList.toggle('fa-sun', dark);
        }
    }
}

// ============================================
// UTILITY FUNCTIONS (Global)
// ============================================

// Confirm delete
function confirmDelete(donorName) {
    return confirm(`Are you sure you want to delete donor: ${donorName}?`);
}

// Print donor details
function printDonorDetails(donorId) {
    const win = window.open(`/donor/${donorId}/`, '_blank');
    win.addEventListener('load', () => setTimeout(() => win.print(), 500));
}

// Export donors to CSV
function exportToCSV() {
    const donors = document.querySelectorAll('.donor-card');
    if (!donors.length) return;

    let csv = 'Name,Blood Group,Phone,Email,City,Status\n';
    donors.forEach(d => {
        const name = d.querySelector('.donor-name h3')?.textContent || '';
        const bg = d.querySelector('.blood-group')?.textContent || '';
        const phone = d.querySelector('.donor-info p:first-child')?.textContent.replace('📞', '').trim() || '';
        const email = d.querySelector('.donor-info p:nth-child(2)')?.textContent.replace('✉️', '').trim() || '';
        const city = d.querySelector('.donor-info p:nth-child(3)')?.textContent.replace('📍', '').trim() || '';
        const status = d.querySelector('.donor-status')?.textContent.trim() || '';
        csv += `"${name}","${bg}","${phone}","${email}","${city}","${status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'donors.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Expose to window (for inline onclick)
window.confirmDelete = confirmDelete;
window.printDonorDetails = printDonorDetails;
window.exportToCSV = exportToCSV;



// ============================================
// 🔔 TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'danger': 'fa-exclamation-triangle',
        'info': 'fa-info-circle',
        'warning': 'fa-exclamation-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Slide in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto hide
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

// Convert Django messages to toasts
document.addEventListener('DOMContentLoaded', function() {
    const messages = document.querySelectorAll('.messages .alert');
    messages.forEach(msg => {
        const text = msg.getAttribute('data-message') || msg.textContent.trim();
        const type = msg.classList.contains('alert-success') ? 'success' :
                     msg.classList.contains('alert-error') ? 'error' :
                     msg.classList.contains('alert-danger') ? 'danger' :
                     'info';
        showToast(text, type);
    });
});