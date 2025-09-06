document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = 'http://localhost:5000/api';
    let selectedUserId = null;

    // Chart instances
    let peakHoursChart = null;
    let peakHoursModeChart = null;
    let travelHeatmap = null;
    let trendsChart = null;
    let hotspotsMap = null;

    async function populateUserDropdown() {
        const select = document.getElementById('mlUserSelect');
        try {
            const response = await fetch(`${API_BASE}/users`);
            const users = await response.json();
            select.innerHTML = '';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.username || `${user.first_name} ${user.last_name}`;
                select.appendChild(option);
            });
            selectedUserId = users[0]?.id;
            if (selectedUserId) {
                fetchAllPredictions(selectedUserId);
            }
            select.addEventListener('change', (e) => {
                selectedUserId = e.target.value;
                fetchAllPredictions(selectedUserId);
            });
        } catch (error) {
            console.error('Failed to load users:', error);
            select.innerHTML = '<option>Error loading users</option>';
        }
    }

    async function fetchAllPredictions(userId) {
        if (!userId) return;
        try {
            const response = await fetch(`${API_BASE}/ml/predictions?user_id=${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new TypeError('Expected an array of predictions, but received something else.');
            }
            renderAllVisualizations(data);
        } catch (error) {
            console.error('Failed to fetch ML predictions:', error);
        }
    }

    function renderAllVisualizations(data) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const chartId = card.querySelector('canvas, div[id]').id;
                    
                    // Find the right data and render the chart
                    switch (chartId) {
                        case 'peakHoursChart':
                            renderPeakHoursChart(data.find(p => p.prediction_type === 'peak_overall')?.result || []);
                            break;
                        case 'peakHoursModeChart':
                            renderPeakHoursModeChart(data.find(p => p.prediction_type === 'peak_by_mode')?.result || []);
                            break;
                        case 'travelHeatmap':
                            renderTravelHeatmap(data.find(p => p.prediction_type === 'peak_by_mode_dow')?.result || []);
                            break;
                        case 'hotspotsMap':
                            renderHotspotsMap(data.find(p => p.prediction_type === 'overall_hotspots')?.result || []);
                            break;
                        case 'hotspotsTable':
                            renderHotspotsTable(data.find(p => p.prediction_type === 'overall_hotspots')?.result || []);
                            break;
                        case 'dailyHotspotsTable':
                            renderDailyHotspotsTable(data.find(p => p.prediction_type === 'daily_hotspots_top3')?.result || []);
                            break;
                        case 'trendsChart':
                            renderTrendsChart(data.find(p => p.prediction_type === 'per_day_mode_area')?.result || []);
                            break;
                    }
                    
                    // Add 'loaded' class to hide loading indicator and show content
                    card.classList.add('loaded');
                    // Stop observing once loaded
                    observer.unobserve(card);
                }
            });
        }, { rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.chart-card, .table-card').forEach(card => {
            observer.observe(card);
        });
    }

    function renderPeakHoursChart(data) {
        if (peakHoursChart) peakHoursChart.destroy();
        const ctx = document.getElementById('peakHoursChart').getContext('2d');
        peakHoursChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => `${d.start_hour}:00`),
                datasets: [{
                    label: 'Trip Count',
                    data: data.map(d => d.trip_count),
                    backgroundColor: '#667eea',
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    }

    function renderPeakHoursModeChart(data) {
        if (peakHoursModeChart) peakHoursModeChart.destroy();
        const ctx = document.getElementById('peakHoursModeChart').getContext('2d');
        const modes = [...new Set(data.map(d => d.mode))];
        const datasets = modes.map(mode => ({
            label: mode,
            data: data.filter(d => d.mode === mode).map(d => ({ x: `${d.start_hour}:00`, y: d.trip_count })),
            backgroundColor: getRandomColor(),
        }));

        peakHoursModeChart = new Chart(ctx, {
            type: 'bar',
            data: { datasets },
            options: {
                responsive: true,
                scales: { x: { stacked: true }, y: { stacked: true } }
            }
        });
    }

    function renderTravelHeatmap(data) {
        if (travelHeatmap) travelHeatmap.destroy();
        const ctx = document.getElementById('travelHeatmap').getContext('2d');
        const labels = [...new Set(data.map(d => d.start_hour))].sort((a, b) => a - b);
        const yLabels = [...new Set(data.map(d => d.dow))];
        const datasets = yLabels.map((dow, i) => ({
            label: dow,
            data: labels.map(hour => {
                const item = data.find(d => d.dow === dow && d.start_hour === hour);
                return item ? item.trip_count : 0;
            }),
            backgroundColor: `rgba(102, 126, 234, ${1 - i / yLabels.length})`,
        }));

        travelHeatmap = new Chart(ctx, {
            type: 'bar',
            data: { labels: labels.map(l => `${l}:00`), datasets },
            options: {
                responsive: true,
                scales: { x: { stacked: true }, y: { stacked: true } }
            }
        });
    }

    function renderHotspotsMap(data) {
        if (hotspotsMap) hotspotsMap.remove();
        hotspotsMap = L.map('hotspotsMap').setView([data[0].dest_lat_approx, data[0].dest_lon_approx], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(hotspotsMap);

        data.forEach(hotspot => {
            L.circle([hotspot.dest_lat_approx, hotspot.dest_lon_approx], {
                radius: hotspot.visits * 10,
                color: '#ef4444',
                fillColor: '#f87171',
                fillOpacity: 0.5
            }).addTo(hotspotsMap).bindPopup(`<b>${hotspot.place_id}</b><br>Visits: ${hotspot.visits}`);
        });
    }

    function renderHotspotsTable(data) {
        const tableBody = document.getElementById('hotspotsTable').querySelector('tbody');
        tableBody.innerHTML = '';
        data.forEach(hotspot => {
            const row = `<tr>
                <td>${hotspot.place_id}</td>
                <td>${hotspot.visits}</td>
                <td>${hotspot.uniq_users}</td>
                <td>${hotspot.top_mode}</td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    }

    function renderDailyHotspotsTable(data) {
        const tableBody = document.getElementById('dailyHotspotsTable').querySelector('tbody');
        tableBody.innerHTML = '';
        data.forEach(hotspot => {
            const row = `<tr>
                <td>${hotspot.date}</td>
                <td>${hotspot.rank}</td>
                <td>${hotspot.place_id}</td>
                <td>${hotspot.visits}</td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    }

    function renderTrendsChart(data) {
        if (trendsChart) trendsChart.destroy();
        const ctx = document.getElementById('trendsChart').getContext('2d');
        const labels = [...new Set(data.map(d => d.date))].sort();
        const modes = [...new Set(data.map(d => d.mode))];
        const datasets = modes.map(mode => ({
            label: mode,
            data: labels.map(date => {
                const item = data.find(d => d.date === date && d.mode === mode);
                return item ? item.visits : 0;
            }),
            borderColor: getRandomColor(),
            fill: false,
        }));

        trendsChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: { responsive: true }
        });
    }

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    populateUserDropdown();
});
