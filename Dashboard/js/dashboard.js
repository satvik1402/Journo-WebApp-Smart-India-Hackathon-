document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = '/api/dashboard';

    async function fetchDashboardSummary() {
        try {
            const response = await fetch(`${API_BASE}/dashboard-summary`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const summary = await response.json();
            updateDashboardMetrics(summary);
        } catch (error) {
            console.error("Could not fetch dashboard summary:", error);
            const errorState = { total_users: 'N/A', total_trip_logs: 'N/A', total_data_points: 'N/A', analysis_hours: 'N/A' };
            updateDashboardMetrics(errorState);
        }
    }

    function updateDashboardMetrics(data) {
        document.getElementById('totalUsers').textContent = data.total_users;
        document.getElementById('totalTripLogs').textContent = data.total_trip_logs;
        document.getElementById('totalDataPoints').textContent = data.total_data_points;
        document.getElementById('analysisHours').textContent = `${data.analysis_hours}h`;
    }

    fetchDashboardSummary();
});


