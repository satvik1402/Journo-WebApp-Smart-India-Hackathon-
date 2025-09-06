document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://localhost:5000/api';
    const userSelect = document.getElementById('manualUserSelect');
    const tripListContainer = document.getElementById('tripListContainer');
    const manualTripForm = document.getElementById('manualTripForm');
    let selectedUserId;

    async function populateUserDropdown() {
        try {
            const response = await fetch(`${API_BASE}/users`);
            const users = await response.json();
            userSelect.innerHTML = ''; // Clear loading text
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.username || `${user.first_name} ${user.last_name}`;
                userSelect.appendChild(option);
            });
            selectedUserId = users[0]?.id;
            if (selectedUserId) {
                fetchManualTrips(selectedUserId);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    async function fetchManualTrips(userId) {
        try {
            const response = await fetch(`${API_BASE}/manual-trips?user_id=${userId}`);
            const trips = await response.json();
            renderTrips(trips);
        } catch (error) {
            console.error('Failed to fetch manual trips:', error);
        }
    }

    function renderTrips(trips) {
        tripListContainer.innerHTML = '';
        if (trips.length === 0) {
            tripListContainer.innerHTML = '<p>No manual trips found for this user.</p>';
            return;
        }
        trips.forEach(trip => {
            const tripItem = document.createElement('div');
            tripItem.className = 'trip-item';
            tripItem.innerHTML = `
                <div class="trip-details">
                    <h4>${trip.start_address} to ${trip.end_address}</h4>
                    <p><strong>Mode:</strong> ${trip.mode} | <strong>When:</strong> ${new Date(trip.start_time).toLocaleString()}</p>
                </div>
                <div class="trip-actions">
                    <button onclick="deleteTrip(${trip.id})"><i class='bx bx-trash'></i></button>
                </div>
            `;
            tripListContainer.appendChild(tripItem);
        });
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData(manualTripForm);
        const tripData = {
            user_id: selectedUserId,
            start_address: document.getElementById('start_address').value,
            end_address: document.getElementById('end_address').value,
            start_time: document.getElementById('start_time').value,
            end_time: document.getElementById('end_time').value || null,
            mode: document.getElementById('mode').value,
            distance_km: document.getElementById('distance_km').value || null,
            duration_minutes: document.getElementById('duration_minutes').value || null,
            cost_usd: document.getElementById('cost_usd').value || null,
            notes: document.getElementById('notes').value || null,
        };

        try {
            const response = await fetch(`${API_BASE}/manual-trips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tripData)
            });
            if (response.ok) {
                manualTripForm.reset();
                fetchManualTrips(selectedUserId);
            } else {
                console.error('Failed to add trip:', await response.json());
            }
        } catch (error) {
            console.error('Error submitting trip:', error);
        }
    }

    window.deleteTrip = async function(tripId) {
        if (!confirm('Are you sure you want to delete this trip?')) return;
        try {
            const response = await fetch(`${API_BASE}/manual-trips/${tripId}`, { method: 'DELETE' });
            if (response.ok) {
                fetchManualTrips(selectedUserId);
            } else {
                console.error('Failed to delete trip:', await response.json());
            }
        } catch (error) {
            console.error('Error deleting trip:', error);
        }
    }

    userSelect.addEventListener('change', (e) => {
        selectedUserId = e.target.value;
        fetchManualTrips(selectedUserId);
    });

    manualTripForm.addEventListener('submit', handleFormSubmit);

    populateUserDropdown();
});
