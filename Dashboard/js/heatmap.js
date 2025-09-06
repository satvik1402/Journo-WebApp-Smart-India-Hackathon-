let map;
let heatmap;
const API_BASE = 'http://localhost:5000/api';

// State variables
let selectedUserId;
let selectedHeatmapType = 'density';
let selectedMode = 'walking';

// DOM Elements
const userSelect = document.getElementById('heatmapUserSelect');
const typeSelect = document.getElementById('heatmapTypeSelect');
const loader = document.getElementById('heatmapLoader');

// This function is the callback for the Google Maps script
function initMap() {
    map = new google.maps.Map(document.getElementById('heatmapContainer'), {
        zoom: 12,
        center: { lat: 19.0760, lng: 72.8777 }, // Default to Mumbai
        mapTypeId: 'roadmap' // Use a standard map type
    });

    initializeAppLogic();
}

function initializeAppLogic() {
    populateUserDropdown();

    userSelect.addEventListener('change', (e) => {
        selectedUserId = e.target.value;
        updateHeatmap();
    });

    typeSelect.addEventListener('change', (e) => {
        selectedHeatmapType = e.target.value;
        updateHeatmap();
    });
}

async function populateUserDropdown() {
    try {
        const response = await fetch(`${API_BASE}/users`);
        const users = await response.json();
        userSelect.innerHTML = '';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.username || `${user.first_name} ${user.last_name}`;
            userSelect.appendChild(option);
        });
        selectedUserId = users[0]?.id;
        if (selectedUserId) {
            updateHeatmap();
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function updateHeatmap() {
    if (!selectedUserId) return;

    loader.classList.add('visible');

    let url = `${API_BASE}/heatmap-data?user_id=${selectedUserId}&type=${selectedHeatmapType}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        renderHeatmap(data);
    } catch (error) {
        console.error('Failed to fetch heatmap data:', error);
    } finally {
        loader.classList.remove('visible');
    }
}

function renderHeatmap(data) {
    if (heatmap) {
        heatmap.setMap(null);
    }

    if (data && data.length > 0) {
        const heatmapData = data.map(point => ({
            location: new google.maps.LatLng(point[0], point[1]),
            weight: point[2] || 0.5 // Provide a default weight if null
        }));

        heatmap = new google.maps.visualization.HeatmapLayer({
            data: heatmapData,
            map: map
        });

        // Auto-center the map on the new data
        const bounds = new google.maps.LatLngBounds();
        heatmapData.forEach(point => bounds.extend(point.location));
        map.fitBounds(bounds);

        // Customize heatmap appearance
        heatmap.set('radius', 20);
        heatmap.set('opacity', 0.7);
        heatmap.set('dissipating', true);
    } else {
        // If no data, center on a default location
        map.setCenter({ lat: 19.0760, lng: 72.8777 });
        map.setZoom(12);
    }
}
