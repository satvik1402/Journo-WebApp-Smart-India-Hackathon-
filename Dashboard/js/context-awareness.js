const API_BASE = 'http://localhost:5000/api';
let map, placesService, directionsService, directionsRenderer;
let userMarker, selectedUserId;

function initMap() {
    const mumbai = { lat: 19.0760, lng: 72.8777 };
    map = new google.maps.Map(document.getElementById('contextMap'), {
        center: mumbai,
        zoom: 14,
    });
    placesService = new google.maps.places.PlacesService(map);
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });
    directionsRenderer.setMap(map);

    populateUserDropdown();
    document.getElementById('findPlacesBtn').addEventListener('click', findNearbyPlaces);
}

async function populateUserDropdown() {
    const select = document.getElementById('contextUserSelect');
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
            updateUserLocation(selectedUserId);
        }
        select.addEventListener('change', (e) => {
            selectedUserId = e.target.value;
            updateUserLocation(selectedUserId);
        });
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function updateUserLocation(userId) {
    try {
        const response = await fetch(`${API_BASE}/context/last-location?user_id=${userId}`);
        const location = await response.json();
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number' || isNaN(location.lat) || isNaN(location.lng)) {
            console.error('Invalid or incomplete location data received:', location);
            // Fallback to a default location if data is invalid
            if (userMarker) userMarker.setMap(null); // Hide marker if location is invalid
            map.setCenter({ lat: 19.0760, lng: 72.8777 });
            return;
        }
        const userPosition = new google.maps.LatLng(location.lat, location.lng);

        if (userMarker) {
            userMarker.setPosition(userPosition);
        } else {
            userMarker = new google.maps.Marker({
                position: userPosition,
                map: map,
                title: 'Your Location',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "white"
                }
            });
        }
        map.setCenter(userPosition);
        clearPlaces();
    } catch (error) {
        console.error('Failed to update user location:', error);
    }
}

function findNearbyPlaces() {
    if (!userMarker) return;

    const placeType = document.getElementById('placeTypeSelect').value;
    const request = {
        location: userMarker.getPosition(),
        radius: 5000, // 5km radius, as a number
        keyword: placeType.replace(/_/g, ' ') // Use keyword instead of deprecated type
    };

    placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            displayPlaces(results);
        }
    });
}

let placeMarkers = [];
function displayPlaces(places) {
    clearPlaces();
    const placesList = document.getElementById('placesList');

    places.forEach(place => {
        const placeItem = document.createElement('div');
        placeItem.className = 'place-item';
        placeItem.innerHTML = `<h4>${place.name}</h4><p>${place.vicinity}</p><div class="details"></div>`;
        placeItem.onclick = () => showRouteToPlace(place);
        placesList.appendChild(placeItem);

        const marker = new google.maps.Marker({
            map: map,
            position: place.geometry.location,
            title: place.name
        });
        placeMarkers.push(marker);
    });
}

function showRouteToPlace(place) {
    if (!userMarker) return;

    const request = {
        origin: userMarker.getPosition(),
        destination: place.geometry.location,
        travelMode: 'DRIVING'
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            const leg = result.routes[0].legs[0];

            // Highlight the selected item
            const allPlaceItems = document.querySelectorAll('.place-item');
            allPlaceItems.forEach(item => item.classList.remove('active'));
            const placeItem = Array.from(allPlaceItems).find(item => item.querySelector('h4').textContent === place.name);

            if (placeItem) {
                placeItem.classList.add('active');
                const detailsDiv = placeItem.querySelector('.details');
                detailsDiv.innerHTML = `<i class='bx bx-car'></i> ${leg.distance.text} <span style="margin:0 0.5rem">|</span> <i class='bx bx-time-five'></i> ${leg.duration.text}`;
            }
        }
    });
}

function clearPlaces() {
    document.getElementById('placesList').innerHTML = '';
    placeMarkers.forEach(marker => marker.setMap(null));
    placeMarkers = [];
    if (directionsRenderer) {
        directionsRenderer.setDirections({routes: []});
    }
}
