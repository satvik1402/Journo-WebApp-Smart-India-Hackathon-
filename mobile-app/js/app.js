const API_BASE_INPUT = document.getElementById('apiBase');
const saveApiBtn = document.getElementById('saveApi');
const userIdInput = document.getElementById('userId');
const modeSelect = document.getElementById('mode');
const startBtn = document.getElementById('startTrip');
const stopBtn = document.getElementById('stopTrip');
const flushBtn = document.getElementById('flushNow');
const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const latEl = document.getElementById('lat');
const lngEl = document.getElementById('lng');
const accEl = document.getElementById('acc');
const spdEl = document.getElementById('spd');
const bufferCountEl = document.getElementById('bufferCount');

let API_BASE = localStorage.getItem('API_BASE') || 'http://localhost:5001/api';
API_BASE_INPUT.value = API_BASE;

saveApiBtn.addEventListener('click', ()=>{
  API_BASE = API_BASE_INPUT.value || API_BASE;
  localStorage.setItem('API_BASE', API_BASE);
  toast('Saved API base');
});

function toast(msg){ statusEl.textContent = msg; }
function log(msg){ logEl.textContent += `\n${new Date().toISOString()}  ${msg}`; logEl.scrollTop = logEl.scrollHeight; }

let watchId = null; // geolocation watch
let tripId = null;  // current trip id
let pointBuffer = []; // buffered trip points
let lastFlushAt = 0;

async function createTrip(){
  const userId = Number(userIdInput.value || '1');
  const mode = modeSelect.value;
  const body = {
    user_id: userId,
    start_time: new Date().toISOString(),
    mode,
    start_location: { lat: lastLatLng?.lat, lng: lastLatLng?.lng, address: '' },
    distance_km: 0,
    duration_minutes: 0,
    is_manual: true
  };
  const res = await fetch(`${API_BASE}/trips`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
  if(!res.ok) throw new Error(`Create trip failed ${res.status}`);
  const data = await res.json();
  return data.trip.id;
}

async function endTrip(){
  if(!tripId) return;
  const res = await fetch(`${API_BASE}/trips/${tripId}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ end_time: new Date().toISOString() })});
  if(!res.ok) throw new Error(`End trip failed ${res.status}`);
}

async function uploadBuffer(){
  if(!tripId || pointBuffer.length===0) return;
  const toUpload = [...pointBuffer];
  pointBuffer = [];
  bufferCountEl.textContent = '0';
  for(const p of toUpload){
    try{
      const res = await fetch(`${API_BASE}/trips/${tripId}/points`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(p)});
      if(!res.ok) throw new Error(`Point upload ${res.status}`);
    }catch(e){
      log('Point upload error, re-queue');
      pointBuffer.push(p);
    }
  }
  lastFlushAt = Date.now();
}

let lastLatLng = null;
function onPosition(pos){
  const { latitude, longitude, accuracy, speed } = pos.coords;
  lastLatLng = {lat: latitude, lng: longitude};
  latEl.textContent = latitude.toFixed(6);
  lngEl.textContent = longitude.toFixed(6);
  accEl.textContent = Math.round(accuracy);
  spdEl.textContent = speed ? speed.toFixed(2) : '0';
  const point = { latitude, longitude, accuracy, speed: speed||0, timestamp: new Date(pos.timestamp).toISOString() };
  pointBuffer.push(point);
  bufferCountEl.textContent = String(pointBuffer.length);
  // Auto flush every 10 points or 30s
  if(pointBuffer.length >= 10 || (Date.now()-lastFlushAt) > 30000) uploadBuffer();
}

function onError(err){ log(`Geolocation error: ${err.message}`); }

async function startTrip(){
  try{
    if(!watchId){
      watchId = navigator.geolocation.watchPosition(onPosition, onError, { enableHighAccuracy:true, maximumAge:5000, timeout:15000});
    }
    tripId = await createTrip();
    toast(`Trip started #${tripId}`);
    log(`Trip started #${tripId}`);
  }catch(e){ toast('Failed to start trip'); log(e.message); }
}

async function stopTrip(){
  try{
    if(watchId){ navigator.geolocation.clearWatch(watchId); watchId = null; }
    await uploadBuffer();
    await endTrip();
    toast(`Trip ended #${tripId}`);
    log(`Trip ended #${tripId}`);
    tripId = null;
  }catch(e){ toast('Failed to stop trip'); log(e.message); }
}

// Manual mode override
document.querySelectorAll('.chip[data-mode]').forEach(btn=>{
  btn.addEventListener('click', async ()=>{
    const newMode = btn.dataset.mode;
    modeSelect.value = newMode;
    if(tripId){
      try{
        const res = await fetch(`${API_BASE}/trips/${tripId}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode: newMode, is_manual: true })});
        if(!res.ok) throw new Error('Mode update failed');
        toast(`Mode set to ${newMode}`);
      }catch(e){ log(e.message); }
    }else{
      toast(`Mode selected: ${newMode}`);
    }
  });
});

startBtn.addEventListener('click', startTrip);
stopBtn.addEventListener('click', stopTrip);
flushBtn.addEventListener('click', uploadBuffer);

toast('Ready');

// Main App Controller
class TravelTrackerApp {
    constructor() {
        this.currentUser = null;
        this.currentTrip = null;
        this.tripDetection = new TripDetection();
        this.locationService = new LocationService();
        this.apiService = new ApiService();
        
        this.init();
    }
    
    async init() {
        // Register service worker for PWA
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
        
        // Initialize event listeners
        this.setupEventListeners();
        
        // Load user data if available
        await this.loadUserData();
        
        // Load recent trips
        await this.loadRecentTrips();
        
        // Initialize location service
        await this.locationService.init();
        
        console.log('App initialized successfully');
    }
    
    setupEventListeners() {
        // Trip control buttons
        document.getElementById('start-trip-btn').addEventListener('click', () => this.startTrip());
        document.getElementById('stop-trip-btn').addEventListener('click', () => this.stopTrip());
        
        // Manual trip form
        document.getElementById('manual-trip-form').addEventListener('submit', (e) => this.handleManualTrip(e));
        
        // Login modal
        document.getElementById('login-btn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.querySelector('.close').addEventListener('click', () => this.hideLoginModal());
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('login-modal');
            if (e.target === modal) {
                this.hideLoginModal();
            }
        });
        
        // Trip detection events
        this.tripDetection.on('tripStarted', (trip) => this.onTripStarted(trip));
        this.tripDetection.on('tripUpdated', (trip) => this.onTripUpdated(trip));
        this.tripDetection.on('tripEnded', (trip) => this.onTripEnded(trip));
        this.tripDetection.on('modeDetected', (mode) => this.onModeDetected(mode));
        
        // Location service events
        this.locationService.on('locationUpdate', (location) => this.onLocationUpdate(location));
        this.locationService.on('locationError', (error) => this.onLocationError(error));
    }
    
    async loadUserData() {
        // Check if user is logged in (stored in localStorage)
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            document.getElementById('user-name').textContent = this.currentUser.username;
            document.getElementById('login-btn').textContent = 'Logout';
        }
    }
    
    async loadRecentTrips() {
        if (!this.currentUser) {
            this.showMessage('Please login to view your trips', 'error');
            return;
        }
        
        try {
            const trips = await this.apiService.getTrips(this.currentUser.id);
            this.displayRecentTrips(trips);
        } catch (error) {
            console.error('Error loading recent trips:', error);
            this.showMessage('Failed to load recent trips', 'error');
        }
    }
    
    displayRecentTrips(trips) {
        const container = document.getElementById('recent-trips-list');
        
        if (!trips || trips.length === 0) {
            container.innerHTML = '<p class="no-data">No trips recorded yet</p>';
            return;
        }
        
        const tripsHtml = trips.map(trip => `
            <div class="trip-item">
                <div class="trip-item-header">
                    <span class="trip-mode">${this.getModeEmoji(trip.mode)} ${trip.mode}</span>
                    <span class="trip-time">${this.formatDateTime(trip.start_time)}</span>
                </div>
                <div class="trip-details-small">
                    <div>Distance: ${trip.distance_km ? trip.distance_km.toFixed(1) + ' km' : 'N/A'}</div>
                    <div>Duration: ${trip.duration_minutes ? this.formatDuration(trip.duration_minutes) : 'N/A'}</div>
                    <div>CO₂: ${trip.co2_emissions ? trip.co2_emissions.toFixed(2) + ' kg' : 'N/A'}</div>
                    <div>Cost: ${trip.cost_rupees ? '₹' + trip.cost_rupees.toFixed(2) : 'N/A'}</div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = tripsHtml;
    }
    
    async startTrip() {
        if (!this.currentUser) {
            this.showMessage('Please login to start a trip', 'error');
            return;
        }
        
        try {
            // Get current location
            const location = await this.locationService.getCurrentLocation();
            
            // Start trip detection
            this.currentTrip = await this.tripDetection.startTrip(this.currentUser.id, location);
            
            // Update UI
            this.updateTripUI('active');
            this.showMessage('Trip started! Travel safely.', 'success');
            
        } catch (error) {
            console.error('Error starting trip:', error);
            this.showMessage('Failed to start trip: ' + error.message, 'error');
        }
    }
    
    async stopTrip() {
        if (!this.currentTrip) {
            return;
        }
        
        try {
            // Get final location
            const location = await this.locationService.getCurrentLocation();
            
            // Stop trip detection
            const completedTrip = await this.tripDetection.stopTrip(location);
            
            // Save trip to server
            await this.apiService.createTrip(completedTrip);
            
            // Update UI
            this.updateTripUI('ready');
            this.showMessage('Trip completed and saved!', 'success');
            
            // Reload recent trips
            await this.loadRecentTrips();
            
            this.currentTrip = null;
            
        } catch (error) {
            console.error('Error stopping trip:', error);
            this.showMessage('Failed to stop trip: ' + error.message, 'error');
        }
    }
    
    async handleManualTrip(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            this.showMessage('Please login to save a trip', 'error');
            return;
        }
        
        const formData = new FormData(e.target);
        const tripData = {
            user_id: this.currentUser.id,
            mode: document.getElementById('trip-mode-select').value,
            start_address: document.getElementById('start-address').value,
            end_address: document.getElementById('end-address').value,
            notes: document.getElementById('trip-notes').value,
            is_manual: true
        };
        
        try {
            // Get coordinates for addresses
            const startCoords = await this.locationService.geocodeAddress(tripData.start_address);
            const endCoords = await this.locationService.geocodeAddress(tripData.end_address);
            
            // Calculate distance
            const distance = this.locationService.calculateDistance(startCoords, endCoords);
            
            // Create trip object
            const trip = {
                ...tripData,
                start_time: new Date().toISOString(),
                start_location: {
                    lat: startCoords.lat,
                    lng: startCoords.lng,
                    address: tripData.start_address
                },
                end_location: {
                    lat: endCoords.lat,
                    lng: endCoords.lng,
                    address: tripData.end_address
                },
                distance_km: distance
            };
            
            // Save trip
            await this.apiService.createTrip(trip);
            
            // Reset form
            e.target.reset();
            
            // Show success message
            this.showMessage('Trip saved successfully!', 'success');
            
            // Reload recent trips
            await this.loadRecentTrips();
            
        } catch (error) {
            console.error('Error saving manual trip:', error);
            this.showMessage('Failed to save trip: ' + error.message, 'error');
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const user = await this.apiService.login(username, password);
            this.currentUser = user;
            
            // Store user data
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Update UI
            document.getElementById('user-name').textContent = user.username;
            document.getElementById('login-btn').textContent = 'Logout';
            this.hideLoginModal();
            
            // Load user data
            await this.loadRecentTrips();
            
            this.showMessage('Login successful!', 'success');
            
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Login failed: ' + error.message, 'error');
        }
    }
    
    showLoginModal() {
        document.getElementById('login-modal').style.display = 'block';
    }
    
    hideLoginModal() {
        document.getElementById('login-modal').style.display = 'none';
    }
    
    updateTripUI(status) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        const startBtn = document.getElementById('start-trip-btn');
        const stopBtn = document.getElementById('stop-trip-btn');
        const tripInfoCard = document.getElementById('trip-info-card');
        
        if (status === 'active') {
            statusIndicator.querySelector('.status-circle').classList.add('active');
            statusText.textContent = 'Trip in Progress';
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            tripInfoCard.style.display = 'block';
        } else {
            statusIndicator.querySelector('.status-circle').classList.remove('active');
            statusText.textContent = 'Ready to Start Trip';
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            tripInfoCard.style.display = 'none';
        }
    }
    
    onTripStarted(trip) {
        console.log('Trip started:', trip);
        this.updateTripUI('active');
    }
    
    onTripUpdated(trip) {
        console.log('Trip updated:', trip);
        
        // Update trip info display
        document.getElementById('trip-duration').textContent = this.formatDuration(trip.duration_minutes || 0);
        document.getElementById('trip-distance').textContent = `${(trip.distance_km || 0).toFixed(1)} km`;
        document.getElementById('trip-speed').textContent = `${(trip.speed || 0).toFixed(1)} km/h`;
    }
    
    onTripEnded(trip) {
        console.log('Trip ended:', trip);
        this.updateTripUI('ready');
    }
    
    onModeDetected(mode) {
        console.log('Mode detected:', mode);
        document.getElementById('trip-mode').textContent = `${this.getModeEmoji(mode)} ${mode}`;
    }
    
    onLocationUpdate(location) {
        console.log('Location updated:', location);
        
        // Update location display
        document.getElementById('current-location').textContent = location.address || 'Location acquired';
        document.getElementById('location-accuracy').textContent = `${location.accuracy ? location.accuracy.toFixed(0) : 'N/A'}m`;
    }
    
    onLocationError(error) {
        console.error('Location error:', error);
        this.showMessage('Location error: ' + error.message, 'error');
    }
    
    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        
        // Add to page
        document.body.appendChild(messageEl);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }
    
    getModeEmoji(mode) {
        const emojis = {
            'walking': '🚶',
            'cycling': '🚴',
            'bus': '🚌',
            'car': '🚗',
            'train': '🚆'
        };
        return emojis[mode] || '🚀';
    }
    
    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TravelTrackerApp();
});
