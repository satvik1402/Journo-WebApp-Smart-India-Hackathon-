// Mobile View JavaScript
// Use a single global for API base to avoid re-declaration across multiple scripts
if (!window.API_BASE) {
    window.API_BASE = '/api';
}

// DOM Elements
const mobileViewToggle = document.getElementById('mobileViewToggle');
const mobileViewContainer = document.getElementById('mobileViewContainer');
const mobileClose = document.getElementById('mobileClose');
const mobilePhoneFrame = document.getElementById('mobilePhoneFrame');
const mobileZoomIn = document.getElementById('mobileZoomIn');
const mobileZoomOut = document.getElementById('mobileZoomOut');
const mobileRotate = document.getElementById('mobileRotate');
const mobileHamburger = document.getElementById('mobileHamburger');
const mobileDropdown = document.getElementById('mobileDropdown');

// Mobile View State
let isMobileViewActive = false;
let currentZoom = 1;
let isRotated = false;
let isDropdownOpen = false;

// Initialize Mobile View
document.addEventListener('DOMContentLoaded', function() {
    initializeMobileView();
    setupMobileViewEventListeners();
});

// Initialize Mobile View
function initializeMobileView() {
    // Check if mobile view was previously active
    const savedState = localStorage.getItem('mobileViewActive');
    if (savedState === 'true') {
        showMobileView();
    }
}

// Setup Event Listeners
function setupMobileViewEventListeners() {
    // Mobile view toggle button
    if (mobileViewToggle) {
        mobileViewToggle.addEventListener('click', toggleMobileView);
    }

    // Mobile view close button
    if (mobileClose) {
        mobileClose.addEventListener('click', hideMobileView);
    }

    // Zoom controls
    if (mobileZoomIn) {
        mobileZoomIn.addEventListener('click', zoomIn);
    }

    if (mobileZoomOut) {
        mobileZoomOut.addEventListener('click', zoomOut);
    }

    // Rotate control
    if (mobileRotate) {
        mobileRotate.addEventListener('click', rotatePhone);
    }

    // Hamburger menu
    if (mobileHamburger) {
        mobileHamburger.addEventListener('click', toggleMobileDropdown);
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (isDropdownOpen && !mobileHamburger.contains(e.target) && !mobileDropdown.contains(e.target)) {
            closeMobileDropdown();
        }
    });

    // Close mobile view when clicking outside
    if (mobileViewContainer) {
        mobileViewContainer.addEventListener('click', function(e) {
            if (e.target === mobileViewContainer) {
                hideMobileView();
            }
        });
    }

    // Close mobile view with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMobileViewActive) {
            hideMobileView();
        }
    });

    // Keyboard shortcuts for zoom
    document.addEventListener('keydown', function(e) {
        if (isMobileViewActive) {
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                zoomIn();
            } else if (e.key === '-') {
                e.preventDefault();
                zoomOut();
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                rotatePhone();
            }
        }
    });
}

// Toggle Mobile View
function toggleMobileView() {
    if (isMobileViewActive) {
        hideMobileView();
    } else {
        showMobileView();
    }
}

// Show Mobile View
function showMobileView() {
    if (!mobileViewContainer) return;

    isMobileViewActive = true;
    mobileViewContainer.classList.add('active');
    
    // Update toggle button state
    if (mobileViewToggle) {
        mobileViewToggle.classList.add('active');
        mobileViewToggle.innerHTML = '<i class="bx bx-desktop"></i>';
        mobileViewToggle.title = 'Switch to Desktop View';
    }

    // Reset zoom and rotation
    currentZoom = 1;
    isRotated = false;
    updatePhoneTransform();

    // Save state
    localStorage.setItem('mobileViewActive', 'true');

    // Load mobile view data
    loadMobileViewData();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Show notification
    if (window.dashboardUtils && window.dashboardUtils.showNotification) {
        window.dashboardUtils.showNotification('Mobile preview activated', 'info');
    }
}

// Hide Mobile View
function hideMobileView() {
    if (!mobileViewContainer) return;

    isMobileViewActive = false;
    mobileViewContainer.classList.remove('active');
    
    // Update toggle button state
    if (mobileViewToggle) {
        mobileViewToggle.classList.remove('active');
        mobileViewToggle.innerHTML = '<i class="bx bx-mobile"></i>';
        mobileViewToggle.title = 'Toggle Mobile View';
    }

    // Save state
    localStorage.setItem('mobileViewActive', 'false');

    // Restore body scroll
    document.body.style.overflow = '';

    // Show notification
    if (window.dashboardUtils && window.dashboardUtils.showNotification) {
        window.dashboardUtils.showNotification('Desktop view restored', 'info');
    }
}

// Load Mobile View Data
async function loadMobileViewData() {
    try {
        await Promise.all([
            loadMobileDocumentStats(),
            loadMobileRecentActivity()
        ]);
    } catch (error) {
        console.error('Error loading mobile view data:', error);
    }
}

// Load Mobile Document Statistics
async function loadMobileDocumentStats() {
    try {
        const response = await fetch(`${window.API_BASE}/documents`);
        if (!response.ok) throw new Error('Failed to fetch documents');
        
        const documents = await response.json();
        
        // Update mobile stats
        updateMobileStatCard('mobileTotalDocuments', documents.length);
        
        // Calculate total pages
        let totalPages = 0;
        for (const doc of documents) {
            if (doc.status === 'COMPLETED') {
                const contentResponse = await fetch(`${window.API_BASE}/documents/${doc.id}/content`);
                if (contentResponse.ok) {
                    const content = await contentResponse.json();
                    totalPages += content.length;
                }
            }
        }
        
        updateMobileStatCard('mobileTotalPages', totalPages);
        
        // Mock data for other stats
        updateMobileStatCard('mobileTotalQuizzes', Math.floor(Math.random() * 20) + 5);
        updateMobileStatCard('mobileStudyTime', Math.floor(Math.random() * 50) + 10);
        
    } catch (error) {
        console.error('Error loading mobile document stats:', error);
        updateMobileStatCard('mobileTotalDocuments', 0);
        updateMobileStatCard('mobileTotalPages', 0);
        updateMobileStatCard('mobileTotalQuizzes', 0);
        updateMobileStatCard('mobileStudyTime', 0);
    }
}

// Update Mobile Stat Card
function updateMobileStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        // Animate number counting
        animateMobileNumber(element, 0, value, 1000);
    }
}

// Animate Mobile Number Counting
function animateMobileNumber(element, start, end, duration) {
    const startTime = performance.now();
    const difference = end - start;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (difference * easeOutQuart));
        
        // Format the number based on the stat type
        if (elementId.includes('StudyTime')) {
            element.textContent = current + 'h';
        } else {
            element.textContent = current.toLocaleString();
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Load Mobile Recent Activity
async function loadMobileRecentActivity() {
    try {
        const response = await fetch(`${window.API_BASE}/documents`);
        if (!response.ok) throw new Error('Failed to fetch documents');
        
        const documents = await response.json();
        const activityList = document.getElementById('mobileRecentActivity');
        
        if (!activityList) return;
        
        // Create activity items from recent documents
        const activities = documents.slice(0, 3).map(doc => {
            const activityType = getActivityType(doc);
            const timeAgo = getTimeAgo(new Date(doc.uploadDate));
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="bx ${activityType.iconClass}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${activityType.title}</h4>
                        <p>${doc.originalFilename}</p>
                    </div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            `;
        });
        
        activityList.innerHTML = activities.join('');
        
    } catch (error) {
        console.error('Error loading mobile recent activity:', error);
        const activityList = document.getElementById('mobileRecentActivity');
        if (activityList) {
            activityList.innerHTML = '<p style="color: #666; text-align: center; padding: 1rem; font-size: 0.8rem;">No recent activity</p>';
        }
    }
}

// Get Activity Type (reuse from dashboard.js)
function getActivityType(document) {
    const status = document.status;
    const fileType = document.fileType?.toLowerCase();
    
    if (status === 'PROCESSING') {
        return {
            title: 'Processing',
            iconClass: 'bx-time'
        };
    } else if (status === 'COMPLETED') {
        if (fileType?.includes('pdf')) {
            return {
                title: 'PDF Uploaded',
                iconClass: 'bx-file-pdf'
            };
        } else if (fileType?.includes('doc')) {
            return {
                title: 'Document Uploaded',
                iconClass: 'bx-file-doc'
            };
        } else if (fileType?.includes('ppt')) {
            return {
                title: 'Presentation Uploaded',
                iconClass: 'bx-file-ppt'
            };
        } else {
            return {
                title: 'File Uploaded',
                iconClass: 'bx-file'
            };
        }
    } else {
        return {
            title: 'Upload Failed',
            iconClass: 'bx-error'
        };
    }
}

// Get Time Ago (reuse from dashboard.js)
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    }
}

// Handle Mobile Navigation
function handleMobileNavigation(url) {
    // Close mobile view before navigation
    hideMobileView();
    
    // Navigate to the URL
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

// Add click handlers for mobile navigation
document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers to mobile dropdown links
    const mobileDropdownLinks = document.querySelectorAll('.mobile-dropdown-menu a');
    mobileDropdownLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                handleMobileNavigation(href);
            }
        });
    });

    // Add click handlers to mobile action cards
    const mobileActionCards = document.querySelectorAll('.mobile-action-card');
    mobileActionCards.forEach(card => {
        card.addEventListener('click', function() {
            const onclick = this.getAttribute('onclick');
            if (onclick) {
                // Extract URL from onclick attribute
                const urlMatch = onclick.match(/window\.location\.href='([^']+)'/);
                if (urlMatch) {
                    handleMobileNavigation(urlMatch[1]);
                }
            }
        });
    });
});

// Zoom Functions
function zoomIn() {
    if (currentZoom < 2) {
        currentZoom += 0.2;
        updatePhoneTransform();
    }
}

function zoomOut() {
    if (currentZoom > 0.5) {
        currentZoom -= 0.2;
        updatePhoneTransform();
    }
}

// Rotate Function
function rotatePhone() {
    isRotated = !isRotated;
    updatePhoneTransform();
}

// Update Phone Transform
function updatePhoneTransform() {
    if (!mobilePhoneFrame) return;
    
    let transform = `scale(${currentZoom})`;
    if (isRotated) {
        transform += ' rotate(90deg)';
    }
    
    mobilePhoneFrame.style.transform = transform;
}

// Mobile Dropdown Functions
function toggleMobileDropdown() {
    if (isDropdownOpen) {
        closeMobileDropdown();
    } else {
        openMobileDropdown();
    }
}

function openMobileDropdown() {
    if (!mobileDropdown || !mobileHamburger) return;
    
    isDropdownOpen = true;
    mobileDropdown.classList.add('active');
    mobileHamburger.classList.add('active');
}

function closeMobileDropdown() {
    if (!mobileDropdown || !mobileHamburger) return;
    
    isDropdownOpen = false;
    mobileDropdown.classList.remove('active');
    mobileHamburger.classList.remove('active');
}

// Handle Mobile Navigation
function handleMobileNavigation(url) {
    // Close dropdown first
    closeMobileDropdown();
    
    // Close mobile view
    hideMobileView();
    
    // Navigate to the URL
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

// Export functions for use in other scripts
window.mobileViewUtils = {
    showMobileView,
    hideMobileView,
    toggleMobileView,
    zoomIn,
    zoomOut,
    rotatePhone,
    toggleMobileDropdown,
    openMobileDropdown,
    closeMobileDropdown,
    handleMobileNavigation,
    isMobileViewActive: () => isMobileViewActive
};
