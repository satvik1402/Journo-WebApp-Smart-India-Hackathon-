// Trip Detection Service
class TripDetection {
    constructor() {
        this.isActive = false;
        this.currentTrip = null;
        this.tripPoints = [];
        this.modeDetection = new ModeDetection();
        this.eventListeners = {};
        
        // Configuration
        this.config = {
            minSpeed: 1.0,        // m/s minimum speed to start trip
            maxIdleTime: 300,     // 5 minutes idle time to end trip
            minTripDuration: 60,  // 1 minute minimum trip duration
            accuracyThreshold: 10, // meters GPS accuracy threshold
            updateInterval: 5000   // 5 seconds between updates
        };
        
        this.lastUpdateTime = null;
        this.idleTimer = null;
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
    
    async startTrip(userId, startLocation) {
        if (this.isActive) {
            throw new Error('Trip already in progress');
        }
        
        this.isActive = true;
        this.currentTrip = {
            user_id: userId,
            start_time: new Date().toISOString(),
            start_lat: startLocation.lat,
            start_lng: startLocation.lng,
            start_address: startLocation.address,
            mode: 'detecting',
            trip_points: []
        };
        
        this.tripPoints = [{
            lat: startLocation.lat,
            lng: startLocation.lng,
            timestamp: new Date().toISOString(),
            accuracy: startLocation.accuracy,
            speed: 0
        }];
        
        // Start monitoring
        this.startMonitoring();
        
        this.emit('tripStarted', this.currentTrip);
        return this.currentTrip;
    }
    
    async stopTrip(endLocation) {
        if (!this.isActive || !this.currentTrip) {
            throw new Error('No active trip to stop');
        }
        
        this.isActive = false;
        
        // Clear monitoring
        this.stopMonitoring();
        
        // Add end location
        this.tripPoints.push({
            lat: endLocation.lat,
            lng: endLocation.lng,
            timestamp: new Date().toISOString(),
            accuracy: endLocation.accuracy,
            speed: 0
        });
        
        // Complete trip data
        this.currentTrip.end_time = new Date().toISOString();
        this.currentTrip.end_lat = endLocation.lat;
        this.currentTrip.end_lng = endLocation.lng;
        this.currentTrip.end_address = endLocation.address;
        this.currentTrip.trip_points = this.tripPoints;
        
        // Calculate trip metrics
        this.calculateTripMetrics();
        
        // Detect final mode
        this.currentTrip.mode = this.modeDetection.detectMode(this.tripPoints);
        this.currentTrip.mode_confidence = this.modeDetection.getConfidence();
        
        this.emit('tripEnded', this.currentTrip);
        
        return this.currentTrip;
    }
    
    startMonitoring() {
        // Start periodic location updates
        this.monitoringInterval = setInterval(() => {
            this.updateTrip();
        }, this.config.updateInterval);
        
        // Start idle timer
        this.resetIdleTimer();
    }
    
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }
    
    async updateTrip() {
        if (!this.isActive) return;
        
        try {
            // Get current location
            const location = await this.getCurrentLocation();
            
            if (!location) {
                console.warn('Could not get location for trip update');
                return;
            }
            
            // Check if location is accurate enough
            if (location.accuracy > this.config.accuracyThreshold) {
                console.warn('Location accuracy too low:', location.accuracy);
                return;
            }
            
            // Add point to trip
            const tripPoint = {
                lat: location.lat,
                lng: location.lng,
                timestamp: new Date().toISOString(),
                accuracy: location.accuracy,
                speed: location.speed || 0
            };
            
            this.tripPoints.push(tripPoint);
            
            // Update trip metrics
            this.calculateTripMetrics();
            
            // Detect mode
            const detectedMode = this.modeDetection.detectMode(this.tripPoints);
            if (detectedMode !== this.currentTrip.mode) {
                this.currentTrip.mode = detectedMode;
                this.currentTrip.mode_confidence = this.modeDetection.getConfidence();
                this.emit('modeDetected', detectedMode);
            }
            
            // Reset idle timer
            this.resetIdleTimer();
            
            this.emit('tripUpdated', this.currentTrip);
            
        } catch (error) {
            console.error('Error updating trip:', error);
        }
    }
    
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        speed: position.coords.speed
                    });
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
    
    calculateTripMetrics() {
        if (this.tripPoints.length < 2) return;
        
        // Calculate total distance
        let totalDistance = 0;
        for (let i = 1; i < this.tripPoints.length; i++) {
            const prev = this.tripPoints[i - 1];
            const curr = this.tripPoints[i];
            totalDistance += this.calculateDistance(prev, curr);
        }
        
        // Calculate duration
        const startTime = new Date(this.tripPoints[0].timestamp);
        const endTime = new Date(this.tripPoints[this.tripPoints.length - 1].timestamp);
        const durationMs = endTime - startTime;
        const durationMinutes = Math.floor(durationMs / 60000);
        
        // Calculate average speed
        const avgSpeed = durationMs > 0 ? (totalDistance * 1000) / (durationMs / 1000) : 0;
        
        // Update trip data
        this.currentTrip.distance_km = totalDistance;
        this.currentTrip.duration_minutes = durationMinutes;
        this.currentTrip.speed = avgSpeed;
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
    
    resetIdleTimer() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
        }
        
        this.idleTimer = setTimeout(() => {
            if (this.isActive) {
                console.log('Trip ended due to inactivity');
                this.autoEndTrip();
            }
        }, this.config.maxIdleTime * 1000);
    }
    
    async autoEndTrip() {
        if (!this.isActive) return;
        
        try {
            const location = await this.getCurrentLocation();
            await this.stopTrip(location);
        } catch (error) {
            console.error('Error auto-ending trip:', error);
            // Force end trip even without location
            this.isActive = false;
            this.stopMonitoring();
            this.emit('tripEnded', this.currentTrip);
        }
    }
}

// Mode Detection Service
class ModeDetection {
    constructor() {
        this.confidence = 0;
        this.modeRules = {
            walking: {
                maxSpeed: 2.0,      // m/s
                minDuration: 60,    // seconds
                accelerationThreshold: 0.5
            },
            cycling: {
                minSpeed: 2.0,      // m/s
                maxSpeed: 8.0,      // m/s
                minDuration: 120    // seconds
            },
            bus: {
                minSpeed: 5.0,      // m/s
                maxSpeed: 15.0,     // m/s
                stopsDetected: true
            },
            car: {
                minSpeed: 8.0,      // m/s
                maxSpeed: 30.0,     // m/s
                smoothMovement: true
            },
            train: {
                minSpeed: 15.0,     // m/s
                maxSpeed: 50.0,     // m/s
                linearMovement: true
            }
        };
    }
    
    detectMode(tripPoints) {
        if (tripPoints.length < 2) return 'detecting';
        
        // Calculate average speed
        const avgSpeed = this.calculateAverageSpeed(tripPoints);
        const duration = this.calculateDuration(tripPoints);
        
        // Apply rules
        let bestMode = 'walking';
        let bestScore = 0;
        
        for (const [mode, rules] of Object.entries(this.modeRules)) {
            const score = this.calculateModeScore(avgSpeed, duration, rules, tripPoints);
            if (score > bestScore) {
                bestScore = score;
                bestMode = mode;
            }
        }
        
        this.confidence = bestScore;
        return bestMode;
    }
    
    calculateAverageSpeed(tripPoints) {
        if (tripPoints.length < 2) return 0;
        
        let totalSpeed = 0;
        let validPoints = 0;
        
        for (let i = 1; i < tripPoints.length; i++) {
            const prev = tripPoints[i - 1];
            const curr = tripPoints[i];
            
            if (curr.speed && curr.speed > 0) {
                totalSpeed += curr.speed;
                validPoints++;
            }
        }
        
        return validPoints > 0 ? totalSpeed / validPoints : 0;
    }
    
    calculateDuration(tripPoints) {
        if (tripPoints.length < 2) return 0;
        
        const startTime = new Date(tripPoints[0].timestamp);
        const endTime = new Date(tripPoints[tripPoints.length - 1].timestamp);
        return (endTime - startTime) / 1000; // seconds
    }
    
    calculateModeScore(speed, duration, rules, tripPoints) {
        let score = 0;
        
        // Speed-based scoring
        if (speed <= rules.maxSpeed && speed >= (rules.minSpeed || 0)) {
            score += 0.4;
        }
        
        // Duration-based scoring
        if (duration >= (rules.minDuration || 0)) {
            score += 0.3;
        }
        
        // Additional checks
        if (rules.stopsDetected && this.hasStops(tripPoints)) {
            score += 0.2;
        }
        
        if (rules.smoothMovement && this.hasSmoothMovement(tripPoints)) {
            score += 0.1;
        }
        
        if (rules.linearMovement && this.hasLinearMovement(tripPoints)) {
            score += 0.1;
        }
        
        return Math.min(score, 1.0);
    }
    
    hasStops(tripPoints) {
        // Check for periods of low speed (stops)
        let stopCount = 0;
        for (let i = 1; i < tripPoints.length; i++) {
            if (tripPoints[i].speed < 1.0) {
                stopCount++;
            }
        }
        return stopCount > tripPoints.length * 0.1; // 10% of points are stops
    }
    
    hasSmoothMovement(tripPoints) {
        // Check for consistent speed changes
        let speedChanges = 0;
        for (let i = 2; i < tripPoints.length; i++) {
            const speedDiff = Math.abs(tripPoints[i].speed - tripPoints[i-1].speed);
            if (speedDiff < 2.0) { // Smooth speed changes
                speedChanges++;
            }
        }
        return speedChanges > tripPoints.length * 0.7; // 70% smooth changes
    }
    
    hasLinearMovement(tripPoints) {
        // Check for linear movement pattern
        if (tripPoints.length < 3) return false;
        
        let linearPoints = 0;
        for (let i = 2; i < tripPoints.length; i++) {
            const angle = this.calculateAngle(tripPoints[i-2], tripPoints[i-1], tripPoints[i]);
            if (angle < 30) { // Small angle changes indicate linear movement
                linearPoints++;
            }
        }
        return linearPoints > tripPoints.length * 0.6; // 60% linear movement
    }
    
    calculateAngle(p1, p2, p3) {
        const angle1 = Math.atan2(p2.lng - p1.lng, p2.lat - p1.lat);
        const angle2 = Math.atan2(p3.lng - p2.lng, p3.lat - p2.lat);
        let angle = Math.abs(angle1 - angle2) * 180 / Math.PI;
        return angle > 180 ? 360 - angle : angle;
    }
    
    getConfidence() {
        return this.confidence;
    }
}
