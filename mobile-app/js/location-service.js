// Location Service
class LocationService {
    constructor() {
        this.currentLocation = null;
        this.watchId = null;
        this.eventListeners = {};
        this.geocoder = null;
    }
    
    async init() {
        // Initialize Google Maps Geocoder if available
        if (typeof google !== 'undefined' && google.maps) {
            this.geocoder = new google.maps.Geocoder();
        }
        
        // Start watching location
        this.startWatchingLocation();
    }
    
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }
    
    startWatchingLocation() {
        if (!navigator.geolocation) {
            this.emit('locationError', new Error('Geolocation not supported'));
            return;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
        };
        
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.onLocationSuccess(position),
            (error) => this.onLocationError(error),
            options
        );
    }
    
    stopWatchingLocation() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }
    
    onLocationSuccess(position) {
        const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            altitude: position.coords.altitude,
            timestamp: new Date().toISOString()
        };
        
        this.currentLocation = location;
        this.emit('locationUpdate', location);
        
        // Geocode address if not already available
        if (!location.address) {
            this.geocodeLocation(location);
        }
    }
    
    onLocationError(error) {
        console.error('Location error:', error);
        this.emit('locationError', error);
    }
    
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (this.currentLocation) {
                resolve(this.currentLocation);
                return;
            }
            
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        speed: position.coords.speed,
                        heading: position.coords.heading,
                        altitude: position.coords.altitude,
                        timestamp: new Date().toISOString()
                    };
                    
                    this.currentLocation = location;
                    this.geocodeLocation(location);
                    resolve(location);
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 30000
                }
            );
        });
    }
    
    async geocodeLocation(location) {
        if (!this.geocoder) {
            // Fallback to reverse geocoding API
            try {
                const response = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.lat}&longitude=${location.lng}&localityLanguage=en`
                );
                const data = await response.json();
                
                if (data.localityInfo && data.localityInfo.administrative) {
                    const admin = data.localityInfo.administrative[0];
                    location.address = `${admin.name}, ${data.countryName}`;
                } else {
                    location.address = `${data.city || 'Unknown'}, ${data.countryName}`;
                }
                
                this.emit('locationUpdate', location);
            } catch (error) {
                console.warn('Reverse geocoding failed:', error);
                location.address = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
            }
            return;
        }
        
        try {
            const latlng = new google.maps.LatLng(location.lat, location.lng);
            this.geocoder.geocode({ location: latlng }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    location.address = results[0].formatted_address;
                    this.emit('locationUpdate', location);
                } else {
                    console.warn('Geocoding failed:', status);
                    location.address = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
                }
            });
        } catch (error) {
            console.warn('Geocoding error:', error);
            location.address = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
        }
    }
    
    async geocodeAddress(address) {
        if (!this.geocoder) {
            // Fallback to geocoding API
            try {
                const response = await fetch(
                    `https://api.bigdatacloud.net/data/forward-geocode-client?query=${encodeURIComponent(address)}&localityLanguage=en`
                );
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    const result = data.results[0];
                    return {
                        lat: result.latitude,
                        lng: result.longitude,
                        address: result.formattedAddress || address
                    };
                } else {
                    throw new Error('Address not found');
                }
            } catch (error) {
                throw new Error('Geocoding failed: ' + error.message);
            }
        }
        
        return new Promise((resolve, reject) => {
            this.geocoder.geocode({ address: address }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    resolve({
                        lat: location.lat(),
                        lng: location.lng(),
                        address: results[0].formatted_address
                    });
                } else {
                    reject(new Error('Geocoding failed: ' + status));
                }
            });
        });
    }
    
    calculateDistance(point1, point2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(point2.lat - point1.lat);
        const dLng = this.toRad(point2.lng - point1.lng);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    toRad(deg) {
        return deg * (Math.PI/180);
    }
    
    getDistanceFromCurrentLocation(targetLat, targetLng) {
        if (!this.currentLocation) {
            return null;
        }
        
        return this.calculateDistance(
            this.currentLocation,
            { lat: targetLat, lng: targetLng }
        );
    }
    
    isLocationAccurate(location, threshold = 10) {
        return location.accuracy <= threshold;
    }
    
    getLocationAge(location) {
        if (!location.timestamp) return null;
        
        const now = new Date();
        const locationTime = new Date(location.timestamp);
        return (now - locationTime) / 1000; // seconds
    }
    
    isLocationFresh(location, maxAge = 300) {
        const age = this.getLocationAge(location);
        return age !== null && age <= maxAge;
    }
}
