// API Service
class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:5000/api';
        this.apiKey = null;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (this.apiKey) {
            defaultOptions.headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        
        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    
    // User endpoints
    async createUser(userData) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }
    
    async login(username, password) {
        const response = await this.request('/users/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        
        if (response.user) {
            this.apiKey = response.user.id; // Simple auth for prototype
        }
        
        return response;
    }
    
    async getUser(userId) {
        return this.request(`/users/${userId}`);
    }
    
    async updateUser(userId, userData) {
        return this.request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }
    
    async getUserStats(userId) {
        return this.request(`/users/${userId}/stats`);
    }
    
    // Trip endpoints
    async getTrips(userId, params = {}) {
        const queryParams = new URLSearchParams({
            user_id: userId,
            ...params,
        });
        
        return this.request(`/trips?${queryParams}`);
    }
    
    async getTrip(tripId) {
        return this.request(`/trips/${tripId}`);
    }
    
    async createTrip(tripData) {
        return this.request('/trips', {
            method: 'POST',
            body: JSON.stringify(tripData),
        });
    }
    
    async updateTrip(tripId, tripData) {
        return this.request(`/trips/${tripId}`, {
            method: 'PUT',
            body: JSON.stringify(tripData),
        });
    }
    
    async deleteTrip(tripId) {
        return this.request(`/trips/${tripId}`, {
            method: 'DELETE',
        });
    }
    
    async addTripPoint(tripId, pointData) {
        return this.request(`/trips/${tripId}/points`, {
            method: 'POST',
            body: JSON.stringify(pointData),
        });
    }
    
    async getTripPoints(tripId) {
        return this.request(`/trips/${tripId}/points`);
    }
    
    // Analytics endpoints
    async getAnalyticsSummary(userId, params = {}) {
        const queryParams = new URLSearchParams({
            user_id: userId,
            ...params,
        });
        
        return this.request(`/analytics/summary?${queryParams}`);
    }
    
    async getHeatmapData(userId) {
        return this.request(`/analytics/heatmap?user_id=${userId}`);
    }
    
    async getPredictions(userId) {
        return this.request(`/analytics/predictions?user_id=${userId}`);
    }
    
    async getReports(userId, params = {}) {
        const queryParams = new URLSearchParams({
            user_id: userId,
            ...params,
        });
        
        return this.request(`/analytics/reports?${queryParams}`);
    }
    
    // Utility methods
    async getConfig() {
        return this.request('/config');
    }
    
    async healthCheck() {
        return this.request('/health');
    }
    
    // Offline support
    async saveTripOffline(tripData) {
        const offlineTrips = this.getOfflineTrips();
        tripData.id = 'offline_' + Date.now();
        tripData.offline = true;
        offlineTrips.push(tripData);
        localStorage.setItem('offlineTrips', JSON.stringify(offlineTrips));
        return tripData;
    }
    
    getOfflineTrips() {
        const trips = localStorage.getItem('offlineTrips');
        return trips ? JSON.parse(trips) : [];
    }
    
    async syncOfflineTrips() {
        const offlineTrips = this.getOfflineTrips();
        const syncedTrips = [];
        
        for (const trip of offlineTrips) {
            try {
                const response = await this.createTrip(trip);
                syncedTrips.push(response.trip);
            } catch (error) {
                console.error('Failed to sync trip:', error);
            }
        }
        
        // Clear synced trips
        if (syncedTrips.length === offlineTrips.length) {
            localStorage.removeItem('offlineTrips');
        }
        
        return syncedTrips;
    }
    
    // Error handling
    handleApiError(error) {
        console.error('API Error:', error);
        
        if (error.message.includes('401')) {
            // Unauthorized - redirect to login
            this.logout();
            return 'Please login again';
        } else if (error.message.includes('403')) {
            return 'Access denied';
        } else if (error.message.includes('404')) {
            return 'Resource not found';
        } else if (error.message.includes('500')) {
            return 'Server error. Please try again later';
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            return 'Network error. Please check your connection';
        } else {
            return error.message || 'An unexpected error occurred';
        }
    }
    
    logout() {
        this.apiKey = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('apiKey');
    }
    
    // Batch operations
    async batchCreateTrips(trips) {
        const results = [];
        
        for (const trip of trips) {
            try {
                const result = await this.createTrip(trip);
                results.push({ success: true, trip: result.trip });
            } catch (error) {
                results.push({ success: false, error: error.message, trip });
            }
        }
        
        return results;
    }
    
    // Data validation
    validateTripData(tripData) {
        const required = ['user_id', 'start_time', 'mode'];
        const missing = required.filter(field => !tripData[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
        
        // Validate mode
        const validModes = ['walking', 'cycling', 'bus', 'car', 'train'];
        if (!validModes.includes(tripData.mode)) {
            throw new Error(`Invalid mode: ${tripData.mode}. Must be one of: ${validModes.join(', ')}`);
        }
        
        // Validate coordinates
        if (tripData.start_location) {
            if (!this.isValidCoordinate(tripData.start_location.lat, tripData.start_location.lng)) {
                throw new Error('Invalid start location coordinates');
            }
        }
        
        if (tripData.end_location) {
            if (!this.isValidCoordinate(tripData.end_location.lat, tripData.end_location.lng)) {
                throw new Error('Invalid end location coordinates');
            }
        }
        
        return true;
    }
    
    isValidCoordinate(lat, lng) {
        return typeof lat === 'number' && typeof lng === 'number' &&
               lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }
    
    // Caching
    setCache(key, data, ttl = 300000) { // 5 minutes default TTL
        const cacheData = {
            data,
            timestamp: Date.now(),
            ttl
        };
        localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    }
    
    getCache(key) {
        const cached = localStorage.getItem(`cache_${key}`);
        if (!cached) return null;
        
        const cacheData = JSON.parse(cached);
        const now = Date.now();
        
        if (now - cacheData.timestamp > cacheData.ttl) {
            localStorage.removeItem(`cache_${key}`);
            return null;
        }
        
        return cacheData.data;
    }
    
    clearCache() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                localStorage.removeItem(key);
            }
        });
    }
}
