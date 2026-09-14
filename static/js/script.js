// Auto-hide messages after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
    const messages = document.querySelectorAll('.alert');
    messages.forEach((message, index) => {
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-20px)';
            setTimeout(() => message.remove(), 500);
        }, 5000 + index * 1000);
    });

    // Add any other global JavaScript
    initializeDateTimePickers();
    initializeFormValidation();
    initializeBloodGroupStats();
});

// Initialize date pickers with current date restrictions
function initializeDateTimePickers() {
    const dobInput = document.querySelector('input[name="date_of_birth"]');
    if (dobInput) {
        const today = new Date();
        const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        dobInput.max = maxDate.toISOString().split('T')[0];
    }
}

// Form validation
function initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = this.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = '#fc8181';
                    isValid = false;
                } else {
                    field.style.borderColor = '#48bb78';
                }
            });
            
            // Validate phone number
            const phoneInput = this.querySelector('input[name="phone"]');
            if (phoneInput && phoneInput.value) {
                const phoneRegex = /^[0-9]{10}$/;
                if (!phoneRegex.test(phoneInput.value)) {
                    alert('Please enter a valid 10-digit phone number');
                    isValid = false;
                }
            }
            
            // Validate email
            const emailInput = this.querySelector('input[name="email"]');
            if (emailInput && emailInput.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailInput.value)) {
                    alert('Please enter a valid email address');
                    isValid = false;
                }
            }
            
            if (!isValid) {
                e.preventDefault();
            }
        });
    });
}

// Fetch and display blood group statistics
function initializeBloodGroupStats() {
    const statsContainer = document.querySelector('.blood-grid');
    if (statsContainer) {
        fetch('/api/stats/')
            .then(response => response.json())
            .then(data => {
                // Update blood group counts dynamically
                document.querySelectorAll('.blood-card').forEach(card => {
                    const bloodType = card.querySelector('.blood-type')?.textContent;
                    if (bloodType && data[bloodType] !== undefined) {
                        const countElement = card.querySelector('.blood-count');
                        if (countElement) {
                            countElement.textContent = `${data[bloodType]} donors`;
                        }
                    }
                });
            })
            .catch(error => console.error('Error fetching stats:', error));
    }
}

// Live search functionality
function setupLiveSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeout = null;
        const resultsContainer = document.getElementById('searchResults');
        
        searchInput.addEventListener('input', function() {
            clearTimeout(timeout);
            const query = this.value.trim();
            
            if (query.length < 2) {
                if (resultsContainer) {
                    resultsContainer.innerHTML = `
                        <div class="search-hint">
                            <i class="fas fa-search fa-3x"></i>
                            <p>Enter at least 2 characters to search</p>
                        </div>
                    `;
                }
                return;
            }
            
            timeout = setTimeout(() => {
                fetch(`/api/search/?q=${encodeURIComponent(query)}`)
                    .then(response => response.json())
                    .then(data => {
                        displaySearchResults(data.results);
                    })
                    .catch(error => console.error('Search error:', error));
            }, 300);
        });
    }
}

function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search fa-3x"></i>
                <p>No donors found matching your search.</p>
            </div>
        `;
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
                <a href="/donor/${donor.id}/" class="btn btn-sm btn-info">
                    View Details
                </a>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// Confirm delete
function confirmDelete(donorName) {
    return confirm(`Are you sure you want to delete donor: ${donorName}?`);
}

// Export functions for use in templates
window.confirmDelete = confirmDelete;
window.setupLiveSearch = setupLiveSearch;

// Initialize live search if on search page
document.addEventListener('DOMContentLoaded', function() {
    setupLiveSearch();
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading spinner for AJAX requests
function showLoadingSpinner(container) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    container.appendChild(spinner);
}

function hideLoadingSpinner(container) {
    const spinner = container.querySelector('.loading-spinner');
    if (spinner) spinner.remove();
}

// Print donor details
function printDonorDetails(donorId) {
    const printWindow = window.open(`/donor/${donorId}/`, '_blank');
    printWindow.addEventListener('load', function() {
        setTimeout(() => {
            printWindow.print();
        }, 500);
    });
}

// Export donor list to CSV
function exportToCSV() {
    const table = document.querySelector('.donor-grid');
    if (!table) return;
    
    let csv = 'Name,Blood Group,Phone,Email,City,Status\n';
    const donors = document.querySelectorAll('.donor-card');
    
    donors.forEach(donor => {
        const name = donor.querySelector('.donor-name h3')?.textContent || '';
        const bloodGroup = donor.querySelector('.blood-group')?.textContent || '';
        const phone = donor.querySelector('.donor-info p:first-child')?.textContent.replace('📞', '').trim() || '';
        const email = donor.querySelector('.donor-info p:nth-child(2)')?.textContent.replace('✉️', '').trim() || '';
        const city = donor.querySelector('.donor-info p:nth-child(3)')?.textContent.replace('📍', '').trim() || '';
        const status = donor.querySelector('.donor-status')?.textContent.trim() || '';
        
        csv += `"${name}","${bloodGroup}","${phone}","${email}","${city}","${status}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'donors.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}