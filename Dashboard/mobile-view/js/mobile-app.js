// Mobile App JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = '/api';
    
    // Error handling wrapper
    function handleApiError(error, fallbackMessage = 'Data unavailable') {
        console.warn('API Error:', error);
        return fallbackMessage;
    }
    
    // Navigation handling
    const navItems = document.querySelectorAll('.nav-item');
    const pageContents = document.querySelectorAll('.page-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.dataset.page;
            switchPage(targetPage);
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    function switchPage(pageId) {
        pageContents.forEach(page => {
            page.classList.remove('active');
        });
        
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Load page-specific data
        switch(pageId) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'trip-detection':
                loadRecentTrips();
                break;
            case 'context-awareness':
                loadContextData();
                break;
        }
    }
    
    // Load dashboard data
    async function loadDashboardData() {
        try {
            const response = await fetch(`${API_BASE}/dashboard/dashboard-summary`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            
            document.getElementById('mobileUsers').textContent = data.total_users || '0';
            document.getElementById('mobileTrips').textContent = data.total_trip_logs || '0';
            document.getElementById('mobileDataPoints').textContent = data.total_data_points || '0';
            document.getElementById('mobileHours').textContent = `${data.analysis_hours || '0'}h`;
        } catch (error) {
            document.getElementById('mobileUsers').textContent = '0';
            document.getElementById('mobileTrips').textContent = '0';
            document.getElementById('mobileDataPoints').textContent = '0';
            document.getElementById('mobileHours').textContent = '0h';
            handleApiError(error, 'Dashboard data unavailable');
        }
    }
    
    // Load recent trips
    async function loadRecentTrips() {
        try {
            const response = await fetch(`${API_BASE}/trips?user_id=2001&limit=5`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const trips = await response.json();
            
            const container = document.getElementById('mobileRecentTrips');
            if (trips && trips.length > 0) {
                container.innerHTML = trips.map(trip => `
                    <div class="trip-item">
                        <div class="trip-info">
                            <div class="route">${trip.start_location || 'Unknown'} → ${trip.end_location || 'Unknown'}</div>
                            <div class="details">${formatDate(trip.start_time)} • ${trip.distance || 0}km</div>
                        </div>
                        <div class="trip-mode">${trip.mode || 'Unknown'}</div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p style="text-align: center; color: #718096;">No recent trips found</p>';
            }
        } catch (error) {
            const container = document.getElementById('mobileRecentTrips');
            if (container) {
                container.innerHTML = '<p style="text-align: center; color: #718096;">Unable to load trips</p>';
            }
            handleApiError(error, 'Recent trips unavailable');
        }
    }
    
    // Load context data
    async function loadContextData() {
        try {
            const response = await fetch(`${API_BASE}/context/last-location?user_id=2001`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            
            document.getElementById('mobileCurrentLocation').textContent = data.location || 'Unknown';
            document.getElementById('mobileCurrentActivity').textContent = data.activity || 'Unknown';
            document.getElementById('mobileWeather').textContent = data.weather || 'Unknown';
        } catch (error) {
            document.getElementById('mobileCurrentLocation').textContent = 'Unknown';
            document.getElementById('mobileCurrentActivity').textContent = 'Unknown';
            document.getElementById('mobileWeather').textContent = 'Unknown';
            handleApiError(error, 'Context data unavailable');
        }
    }
    
    // Manual trip form handling
    const manualForm = document.getElementById('mobileManualForm');
    if (manualForm) {
        manualForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                user_id: 2001, // Default user for demo
                start_location: document.getElementById('mobileFromLocation').value,
                end_location: document.getElementById('mobileToLocation').value,
                mode: document.getElementById('mobileTransportMode').value,
                trip_date: document.getElementById('mobileTripDate').value
            };
            
            try {
                const response = await fetch(`${API_BASE}/manual-trips`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    showNotification('Trip added successfully!', 'success');
                    manualForm.reset();
                } else {
                    showNotification('Failed to add trip', 'error');
                }
            } catch (error) {
                console.error('Failed to add manual trip:', error);
                showNotification('Failed to add trip', 'error');
            }
        });
    }
    
    // Trip detection functionality
    window.startTripDetection = function() {
        showNotification('Trip detection started!', 'success');
        // In a real app, this would start GPS tracking
    };
    
    // Utility functions
    function formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `mobile-notification ${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            z-index: 10000;
            font-size: 0.9rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Initialize with dashboard data
    loadDashboardData();
    
    // Set current date as default for manual entry
    const dateInput = document.getElementById('mobileTripDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
});
