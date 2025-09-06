document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = '/api';
    const { jsPDF } = window.jspdf;

    const userSelect = document.getElementById('reportUserSelect');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    async function populateUserDropdown() {
        try {
            const response = await fetch(`${API_BASE}/users`);
            const users = await response.json();
            userSelect.innerHTML = users.map(user => `<option value="${user.id}">${user.username}</option>`).join('');
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    async function fetchReportData() {
        const userId = userSelect.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (!userId) {
            alert('Please select a user.');
            return;
        }

        let reportUrl = `${API_BASE}/analytics/reports?user_id=${userId}`;
        let summaryUrl = `${API_BASE}/analytics/summary?user_id=${userId}`;

        if (startDate) {
            reportUrl += `&start_date=${startDate}`;
            summaryUrl += `&start_date=${startDate}`;
        }
        if (endDate) {
            reportUrl += `&end_date=${endDate}`;
            summaryUrl += `&end_date=${endDate}`;
        }

        try {
            const [reportRes, summaryRes] = await Promise.all([
                fetch(reportUrl),
                fetch(summaryUrl)
            ]);
            const reportData = await reportRes.json();
            const summaryData = await summaryRes.json();

            // Combine the necessary data from both endpoints
            return { ...reportData, summary: { ...reportData.summary, ...summaryData.summary } };
        } catch (error) {
            console.error('Failed to fetch report data:', error);
            return null;
        }
    }

    function generatePdf(title, content) {
        const doc = new jsPDF();
        doc.text(title, 14, 20);
        content(doc);
        doc.save(`${title.replace(/ /g, '_').toLowerCase()}.pdf`);
    }

    document.getElementById('downloadSummary').addEventListener('click', async () => {
        const data = await fetchReportData();
        if (!data) return;

        generatePdf('Travel Summary Report', doc => {
            const metrics = data.efficiency_metrics || {};
            const summary = data.summary || {};
            const co2 = data.co2_analysis || {};
            const cost = data.cost_analysis || {};

            const formatNumber = (num) => (typeof num === 'number' ? num.toFixed(2) : 'N/A');

            const mostEfficient = metrics.most_efficient_mode;
            const leastEfficient = metrics.least_efficient_mode;

            doc.autoTable({
                startY: 30,
                head: [['Metric', 'Value']],
                body: [
                    ['Total Trips', summary.total_trips || 'N/A'],
                    ['Total Distance (km)', formatNumber(summary.total_distance_km)],
                    ['Total Duration (minutes)', formatNumber(summary.total_duration_minutes)],
                    ['Total CO2 (kg)', formatNumber(co2.total_co2_kg)],
                    ['Total Cost (USD)', formatNumber(cost.total_cost_usd)],
                    ['Average Trip Distance (km)', formatNumber(metrics.avg_trip_distance)],
                    ['Average Trip Duration (min)', formatNumber(metrics.avg_trip_duration)],
                    ['Most Efficient Mode', mostEfficient ? `${mostEfficient.mode} (${formatNumber(mostEfficient.efficiency)} km/min)` : 'N/A'],
                    ['Least Efficient Mode', leastEfficient ? `${leastEfficient.mode} (${formatNumber(leastEfficient.efficiency)} km/min)` : 'N/A']
                ]
            });
        });
    });

    document.getElementById('downloadCO2').addEventListener('click', async () => {
        const data = await fetchReportData();
        if (!data) return;

        generatePdf('CO2 Emissions Report', doc => {
            doc.autoTable({
                startY: 30,
                head: [['Mode', 'CO2 (kg)']],
                body: Object.entries(data.co2_analysis.by_mode)
            });
        });
    });

    document.getElementById('downloadCost').addEventListener('click', async () => {
        const data = await fetchReportData();
        if (!data) return;

        generatePdf('Cost Analysis Report', doc => {
            doc.autoTable({
                startY: 30,
                head: [['Mode', 'Cost (USD)']],
                body: Object.entries(data.cost_analysis.by_mode)
            });
        });
    });

    populateUserDropdown();
});
