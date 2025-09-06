from extensions import db
from datetime import datetime

class TripPoint(db.Model):
    """TripPoint model for storing GPS coordinates during trip tracking"""
    
    __tablename__ = 'trip_points'
    
    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey('trips.id'), nullable=False)
    latitude = db.Column(db.Numeric(10, 8), nullable=False)
    longitude = db.Column(db.Numeric(11, 8), nullable=False)
    altitude = db.Column(db.Numeric(8, 2))
    accuracy = db.Column(db.Numeric(8, 2))
    speed = db.Column(db.Numeric(8, 2))  # m/s
    heading = db.Column(db.Numeric(5, 2))  # degrees
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, trip_id, latitude, longitude, altitude=None, accuracy=None, 
                 speed=None, heading=None, timestamp=None):
        self.trip_id = trip_id
        self.latitude = latitude
        self.longitude = longitude
        self.altitude = altitude
        self.accuracy = accuracy
        self.speed = speed
        self.heading = heading
        if timestamp:
            self.timestamp = timestamp
    
    def to_dict(self):
        """Convert trip point to dictionary"""
        return {
            'id': self.id,
            'trip_id': self.trip_id,
            'latitude': float(self.latitude),
            'longitude': float(self.longitude),
            'altitude': float(self.altitude) if self.altitude else None,
            'accuracy': float(self.accuracy) if self.accuracy else None,
            'speed': float(self.speed) if self.speed else None,
            'heading': float(self.heading) if self.heading else None,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
    
    def __repr__(self):
        return f'<TripPoint {self.id}: ({self.latitude}, {self.longitude}) at {self.timestamp}>'
