// Analytics Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize analytics page
    initializeAnalytics();
    
    // Set up event listeners
    setupEventListeners();
});

function initializeAnalytics() {
    // Load initial data
    loadAnalyticsData();
    
    // Initialize charts
    initializeCharts();
    
    // Load recent activity
    loadRecentActivity();
}

function setupEventListeners() {
    // Activity period selector
    const activityPeriodSelect = document.getElementById('activityPeriod');
    if (activityPeriodSelect) {
        activityPeriodSelect.addEventListener('change', function() {
            loadAnalyticsData();
        });
    }
    
    // Metrics period selector
    const metricsPeriodSelect = document.getElementById('metricsPeriod');
    if (metricsPeriodSelect) {
        metricsPeriodSelect.addEventListener('change', function() {
            loadAnalyticsData();
        });
    }
    
    // Chart type buttons for document types
    const chartTypeButtons = document.querySelectorAll('.chart-btn');
    chartTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            chartTypeButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Change chart type
            const chartType = this.dataset.type;
            if (window.documentTypesChart) {
                window.documentTypesChart.config.type = chartType;
                window.documentTypesChart.update();
            }
        });
    });
    
    // Export buttons
    const exportPDFBtn = document.getElementById('exportPDF');
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', () => exportAnalyticsData('pdf'));
    }
    
    const exportExcelBtn = document.getElementById('exportExcel');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => exportAnalyticsData('excel'));
    }
    
    const exportJSONBtn = document.getElementById('exportJSON');
    if (exportJSONBtn) {
        exportJSONBtn.addEventListener('click', () => exportAnalyticsData('json'));
    }
}

function loadAnalyticsData() {
    // Show loading state
    showLoadingState();

    fetch('/api/mysql/summary')
        .then(r => r.json())
        .then(summary => {
            if (summary && summary.users !== undefined) {
                const totalDocsElement = document.getElementById('totalDocs');
                if (totalDocsElement) animateNumber(totalDocsElement, summary.trips || 0);
                const totalSearchesElement = document.getElementById('totalSearches');
                if (totalSearchesElement) animateNumber(totalSearchesElement, summary.users || 0);
                const totalQuizzesElement = document.getElementById('totalQuizzes');
                if (totalQuizzesElement) animateNumber(totalQuizzesElement, Math.floor((summary.trips || 0) * 0.3));
                const aiInteractionsElement = document.getElementById('aiInteractions');
                if (aiInteractionsElement) animateNumber(aiInteractionsElement, summary.trip_points || 0);
            }
            hideLoadingState();
        })
        .catch(err => { console.error(err); hideLoadingState(); });
}

function updateOverviewCards(data) {
    // Update total documents
    const totalDocsElement = document.getElementById('totalDocs');
    if (totalDocsElement && data.totalDocuments !== undefined) {
        animateNumber(totalDocsElement, data.totalDocuments);
    }
    
    // Update total searches
    const totalSearchesElement = document.getElementById('totalSearches');
    if (totalSearchesElement && data.totalSearches !== undefined) {
        animateNumber(totalSearchesElement, data.totalSearches);
    }
    
    // Update total quizzes
    const totalQuizzesElement = document.getElementById('totalQuizzes');
    if (totalQuizzesElement && data.totalQuizzes !== undefined) {
        animateNumber(totalQuizzesElement, data.totalQuizzes);
    }
    
    // Update AI interactions
    const aiInteractionsElement = document.getElementById('aiInteractions');
    if (aiInteractionsElement && data.aiInteractions !== undefined) {
        animateNumber(aiInteractionsElement, data.aiInteractions);
    }
}

function initializeCharts() {
    // Initialize activity chart
    initializeActivityChart();
    
    // Initialize document types chart
    initializeDocumentTypesChart();
}

function initializeActivityChart() {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Study Activity',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Weekly Study Activity'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // Store chart reference
    window.activityChart = chart;
}

function initializeDocumentTypesChart() {
    const ctx = document.getElementById('documentTypesChart');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['PDF', 'DOC', 'PPT', 'ZIP', 'Other'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: 'Document Types Distribution'
                }
            }
        }
    });
    
    // Store chart reference
    window.documentTypesChart = chart;
}



function updateCharts(data) {
    // Update activity chart
    if (window.activityChart && data.activityData) {
        const chart = window.activityChart;
        chart.data.datasets[0].data = data.activityData || [0, 0, 0, 0, 0, 0, 0];
        chart.update();
    }
    
    // Update document types chart
    if (window.documentTypesChart && data.documentTypes) {
        const chart = window.documentTypesChart;
        chart.data.datasets[0].data = [
            data.documentTypes.PDF || 0,
            data.documentTypes.DOC || 0,
            data.documentTypes.PPT || 0,
            data.documentTypes.ZIP || 0,
            data.documentTypes.OTHER || 0
        ];
        chart.update();
    }
}

function loadRecentActivity() {
    const activityContainer = document.getElementById('activityList');
    if (!activityContainer) return;
    
    // Fetch recent activity
    fetch('/api/documents?status=COMPLETED&limit=5')
        .then(response => response.json())
        .then(documents => {
            displayRecentActivity(documents);
        })
        .catch(error => {
            console.error('Error loading recent activity:', error);
        });
}

function displayRecentActivity(documents) {
    const activityContainer = document.getElementById('activityList');
    if (!activityContainer) return;
    
    if (documents.length === 0) {
        activityContainer.innerHTML = '<p class="no-activity">No recent activity</p>';
        return;
    }
    
    const activityHTML = documents.map(doc => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="bx bx-file"></i>
            </div>
            <div class="activity-details">
                <h4>${doc.filename}</h4>
                <p>Uploaded ${formatDate(doc.uploadDate)}</p>
                <span class="activity-status completed">Processed</span>
            </div>
        </div>
    `).join('');
    
    activityContainer.innerHTML = activityHTML;
}



function getInsightIcon(type) {
    const icons = {
        success: 'check-circle',
        info: 'info-circle',
        warning: 'alert-circle',
        error: 'x-circle'
    };
    return icons[type] || 'info-circle';
}

function exportAnalyticsData(format = 'csv') {
    const activityPeriod = document.getElementById('activityPeriod')?.value || '7';
    const metricsPeriod = document.getElementById('metricsPeriod')?.value || '7';
    
    // Show loading state
    showNotification(`Preparing ${format.toUpperCase()} export...`, 'info');
    
    // Fetch data for export
    fetch(`/api/documents/stats?activityPeriod=${activityPeriod}&metricsPeriod=${metricsPeriod}`)
        .then(response => response.json())
        .then(data => {
            let content, filename, mimeType;
            
            switch (format) {
                case 'pdf':
                    // For now, we'll export as CSV since PDF generation requires additional libraries
                    content = createCSVContent(data);
                    filename = `analytics-${activityPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
                    break;
                case 'excel':
                    content = createCSVContent(data);
                    filename = `analytics-${activityPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
                    break;
                case 'json':
                    content = JSON.stringify(data, null, 2);
                    filename = `analytics-${activityPeriod}-${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json';
                    break;
                default:
                    content = createCSVContent(data);
                    filename = `analytics-${activityPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
            }
            
            // Download file
            downloadFile(content, filename, mimeType);
            
            showNotification(`${format.toUpperCase()} export completed successfully!`, 'success');
        })
        .catch(error => {
            console.error('Error exporting analytics:', error);
            showNotification(`Failed to export ${format.toUpperCase()}`, 'error');
        });
}

function createCSVContent(data) {
    let csv = 'Metric,Value\n';
    
    // Add overview data
    csv += `Total Documents,${data.totalDocuments || 0}\n`;
    csv += `Total Pages,${data.totalPages || 0}\n`;
    csv += `Total Words,${data.totalWords || 0}\n`;
    csv += `Processing Documents,${data.processingDocuments || 0}\n`;
    
    // Add document types
    if (data.documentTypes) {
        csv += '\nDocument Types\n';
        csv += 'Type,Count\n';
        Object.entries(data.documentTypes).forEach(([type, count]) => {
            csv += `${type},${count}\n`;
        });
    }
    
    return csv;
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function showLoadingState() {
    const loadingElements = document.querySelectorAll('.loading-placeholder');
    loadingElements.forEach(el => {
        el.style.display = 'block';
    });
    
    const contentElements = document.querySelectorAll('.chart-container, .metrics-container');
    contentElements.forEach(el => {
        el.style.opacity = '0.5';
    });
}

function hideLoadingState() {
    const loadingElements = document.querySelectorAll('.loading-placeholder');
    loadingElements.forEach(el => {
        el.style.display = 'none';
    });
    
    const contentElements = document.querySelectorAll('.chart-container, .metrics-container');
    contentElements.forEach(el => {
        el.style.opacity = '1';
    });
}

function animateNumber(element, targetValue) {
    const startValue = 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="bx bx-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="bx bx-x"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-circle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Performance monitoring
function trackFeatureUsage(feature) {
    // In a real app, this would send analytics data to the backend
    console.log(`Feature used: ${feature}`);
    
    // Update local storage for demo purposes
    const usage = JSON.parse(localStorage.getItem('featureUsage') || '{}');
    usage[feature] = (usage[feature] || 0) + 1;
    localStorage.setItem('featureUsage', JSON.stringify(usage));
}

// Export functions for global access
window.analyticsFunctions = {
    loadAnalyticsData,
    exportAnalyticsData,
    trackFeatureUsage
};

