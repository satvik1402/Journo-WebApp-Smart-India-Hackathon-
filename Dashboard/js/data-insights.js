// data-insights.js
// Handles fetching data and rendering all charts dynamically for the Data Insights page

const API_BASE = 'http://localhost:5000/api';

function getEndpoints(userId) {
    return {
        summary: `${API_BASE}/analytics/summary?user_id=${userId}`,
        reports: `${API_BASE}/analytics/reports?user_id=${userId}`,
        predictions: `${API_BASE}/analytics/predictions?user_id=${userId}`,
        travelTimes: `${API_BASE}/analytics/travel-times?user_id=${userId}`,
        topDestinations: `${API_BASE}/analytics/top-destinations?user_id=${userId}`
    };
}

// Utility to show/hide loading
function showLoading(id, show) {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'block' : 'none';
}

async function fetchAndRenderCharts(userId) {
    if (!userId) return;
    showLoading('durationChartLoading', true);
    showLoading('destPieChartLoading', true);
    showLoading('co2BarChartLoading', true);
    showLoading('expensePieChartLoading', true);
    showLoading('modeBarChartLoading', true);
    showLoading('metricsChartLoading', true);

    const endpoints = getEndpoints(userId);
    try {
        const [summaryRes, reportsRes, travelTimesRes, topDestinationsRes, predictionsRes] = await Promise.all([
            fetch(endpoints.summary),
            fetch(endpoints.reports),
            fetch(endpoints.travelTimes),
            fetch(endpoints.topDestinations),
            fetch(endpoints.predictions)
        ]);

        const summaryData = await summaryRes.json();
        const reportsData = await reportsRes.json();
        const travelTimesData = await travelTimesRes.json();
        const topDestinationsData = await topDestinationsRes.json();
        const predictionsData = await predictionsRes.json();

        renderDurationChart(travelTimesData);
        renderDestPieChart(topDestinationsData);
        renderCO2BarChart(reportsData);
        renderExpensePieChart(reportsData);
        renderModeBarChart(summaryData);
        renderMetricsChart(reportsData, predictionsData);
    } catch (err) {
        console.error('Failed to fetch or render charts:', err);
    } finally {
        showLoading('durationChartLoading', false);
        showLoading('destPieChartLoading', false);
        showLoading('co2BarChartLoading', false);
        showLoading('expensePieChartLoading', false);
        showLoading('modeBarChartLoading', false);
        showLoading('metricsChartLoading', false);
    }
}

let durationChartInstance = null;
function renderDurationChart(travelTimes) {
    showLoading('durationChartLoading', false);
    const ctx = document.getElementById('durationChart').getContext('2d');
    if (durationChartInstance) durationChartInstance.destroy();
    durationChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: travelTimes.labels,
            datasets: [{
                label: 'Avg Duration (min)',
                data: travelTimes.data,
                backgroundColor: '#4A90E2',
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

let destPieChartInstance = null;
function renderDestPieChart(topDestinations) {
    showLoading('destPieChartLoading', false);
    const ctx = document.getElementById('destPieChart').getContext('2d');
    if (destPieChartInstance) destPieChartInstance.destroy();
    destPieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: topDestinations.labels,
            datasets: [{
                data: topDestinations.data,
                backgroundColor: ['#667eea','#764ba2','#00d4aa','#ffb347','#ff4757']
            }]
        },
        options: {responsive: true, plugins: {legend: {position: 'bottom'}}}
    });
}

let co2BarChartInstance = null;
function renderCO2BarChart(reports) {
    showLoading('co2BarChartLoading', false);
    const ctx = document.getElementById('co2BarChart').getContext('2d');
    const modes = Object.keys(reports.co2_analysis.by_mode || {});
    const values = modes.map(m => reports.co2_analysis.by_mode[m]);
    if (co2BarChartInstance) co2BarChartInstance.destroy();
    co2BarChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: modes,
            datasets: [{
                label: 'CO₂ Emissions (kg)',
                data: values,
                backgroundColor: '#764ba2'
            }]
        },
        options: {responsive: true, plugins: {legend: {display: false}}}
    });
}

let expensePieChartInstance = null;
function renderExpensePieChart(reports) {
    showLoading('expensePieChartLoading', false);
    const ctx = document.getElementById('expensePieChart').getContext('2d');
    const modes = Object.keys(reports.cost_analysis.by_mode || {});
    const values = modes.map(m => reports.cost_analysis.by_mode[m]);
    if (expensePieChartInstance) expensePieChartInstance.destroy();
    expensePieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: modes,
            datasets: [{
                data: values,
                backgroundColor: ['#667eea','#764ba2','#00d4aa','#ffb347','#ff4757']
            }]
        },
        options: {responsive: true, plugins: {legend: {position: 'bottom'}}}
    });
}

let modeBarChartInstance = null;
function renderModeBarChart(summary) {
    showLoading('modeBarChartLoading', false);
    const ctx = document.getElementById('modeBarChart').getContext('2d');
    const modes = (summary.mode_distribution || []).map(m => m.mode);
    const counts = (summary.mode_distribution || []).map(m => m.count);
    if (modeBarChartInstance) modeBarChartInstance.destroy();
    modeBarChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: modes,
            datasets: [{
                label: 'Trips',
                data: counts,
                backgroundColor: '#00d4aa'
            }]
        },
        options: {responsive: true, plugins: {legend: {display: false}}}
    });
}

let metricsChartInstance = null;
function renderMetricsChart(reports, predictions) {
    showLoading('metricsChartLoading', false);
    const ctx = document.getElementById('metricsChart').getContext('2d');
    const metrics = reports.efficiency_metrics || {};
    const labels = ['Avg Duration (min)', 'Avg Distance (km)'];
    const data = [metrics.avg_trip_duration || 0, metrics.avg_trip_distance || 0];
    if (metricsChartInstance) metricsChartInstance.destroy();
    metricsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Efficiency',
                data,
                backgroundColor: ['#667eea','#764ba2']
            }]
        },
        options: {responsive: true, plugins: {legend: {display: false}}}
    });
}

async function populateUserDropdown() {
    const select = document.getElementById('insightsUserSelect');
    select.innerHTML = '<option value="">Loading users...</option>';
    try {
        const res = await fetch(`${API_BASE}/users`);
        const users = await res.json();
        select.innerHTML = '';
        if (users.length === 0) {
            select.innerHTML = '<option value="">No users found</option>';
            return;
        }

        users.forEach(user => {
            const opt = document.createElement('option');
            opt.value = user.id;
            opt.textContent = user.username || (user.first_name + ' ' + user.last_name) || user.email;
            select.appendChild(opt);
        });

        select.value = users[0].id;
        fetchAndRenderCharts(select.value);

        select.addEventListener('change', function() {
            fetchAndRenderCharts(this.value);
        });
    } catch (error) {
        console.error('Failed to populate user dropdown:', error);
        select.innerHTML = '<option value="">Failed to load users</option>';
    }
}

document.addEventListener('DOMContentLoaded', populateUserDropdown);
